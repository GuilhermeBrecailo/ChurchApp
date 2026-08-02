# Frontend: Padrao de Composables

Os composables ficam em `web/composables` e devem concentrar regras reutilizaveis de estado, autenticacao e chamadas para a API.

Neste projeto, a ideia e usar composables como uma camada simples de acesso ao backend. As paginas e componentes chamam funcoes do composable, e o composable cuida de montar URL, headers, token, body e retorno padronizado.

## Objetivo

Um composable deve:

- encapsular chamadas HTTP de um dominio do sistema;
- reutilizar `$customFetch`;
- usar `config.public.URL_BACKEND`;
- tipar entradas com DTOs/interfaces;
- retornar `ApiResponse`;
- buscar `access_token` em `useAuth` quando a rota exigir autenticacao;
- evitar duplicar headers e URLs diretamente nas paginas.

## Estrutura basica

Exemplo de organizacao esperada:

```ts
import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";

interface EntityDTO {
  id?: string;
  name: string;
}

export const useEntity = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();

  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const createEntity = async (entity: EntityDTO): Promise<ApiResponse> => {
    return await $customFetch(
      `${config.public.URL_BACKEND}/api/entity/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token.value}`,
        },
        body: entity,
      },
    );
  };

  return {
    createEntity,
  };
};
```

## Composable de autenticacao

Arquivo esperado:

- `web/composables/useAuth.ts`

Responsabilidades:

- guardar `access_token` em `useState`;
- guardar `user` em `useState`;
- fazer login;
- fazer registro;
- renovar sessao via refresh token;
- fazer logout;
- reenviar codigo;
- verificar codigo;
- recuperar senha;
- indicar se o token deve ser renovado.

### Estado

O token deve ser compartilhado assim:

```ts
const access_token = useState("access_token", () => null);
```

O usuario autenticado deve ficar em um estado compartilhado:

```ts
const user = useState<{
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  is_admin: boolean;
  is_free?: boolean;
} | null>("user", () => null);
```

### Sessao

A funcao `session` deve tentar renovar a sessao usando cookie HTTP:

```ts
const { data, error } = await $customFetch(
  `${config.public.URL_BACKEND}/public/auth/refresh-token`,
  {
    credentials: "include",
  },
);
```

Se vier `access_token`, o composable deve:

- salvar o token em `access_token.value`;
- decodificar o JWT com `jwtDecode`;
- preencher `user.value` com os dados do payload.

Se falhar, deve limpar:

```ts
user.value = null;
access_token.value = null;
```

### Login

O login deve enviar email e senha e permitir cookies:

```ts
const login = async (props: { email: string; password: string }) => {
  return await $customFetch(`${config.public.URL_BACKEND}/public/auth/login`, {
    method: "POST",
    body: props,
    credentials: "include",
  });
};
```

### Logout

O logout deve enviar cookie e bearer token:

```ts
const logout = async () => {
  return await $customFetch(`${config.public.URL_BACKEND}/public/auth/logout`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${access_token.value}`,
    },
  });
};
```

### Refresh preventivo

Use `should_refresh` para saber se o token esta perto de expirar:

```ts
const should_refresh = () => {
  if (!access_token.value) return false;

  const payload: any = jwtDecode(access_token.value);
  const now = Date.now() / 1000;

  return payload.exp - now < 60 * 3;
};
```

Essa funcao retorna `true` quando faltam menos de 3 minutos para expirar.

## Composables de recurso

Composables de recurso seguem o padrao do exemplo `useCustomTable`.

Eles devem:

- declarar um DTO local ou importar o tipo do dominio;
- obter `config` com `useRuntimeConfig`;
- obter `access_token` com `useAuth`;
- obter `$customFetch` com `useNuxtApp`;
- expor funcoes CRUD no `return`.

Exemplo de funcoes comuns:

- `createEntity`;
- `getAllEntity`;
- `getEntityById`;
- `updateEntity`;
- `deleteEntity`.

## Headers

Para rotas autenticadas, usar:

```ts
headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${access_token.value}`,
}
```

Para rotas publicas que usam cookie, usar:

```ts
credentials: "include";
```

Quando a rota usa cookie e token, usar os dois.

## Retorno

As funcoes devem retornar `Promise<ApiResponse>`.

Tipo base:

```ts
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status?: number;
}
```

Isso permite que a tela trate respostas sempre do mesmo jeito:

```ts
const { data, error } = await createEntity(payload);

if (error) {
  // mostrar erro
}
```

## Convencao de nomes

Nome do arquivo:

- `useAuth.ts`;
- `useUser.ts`;
- `useCrunch.ts`;
- `useDepartment.ts`;
- `useSchedule.ts`;
- funcoes de recursos e musicas dentro de `useDepartments`.

Nome da funcao:

- `useAuth`;
- `useUser`;
- `useCrunch`;
- `useDepartment`;
- `useSchedule`;
- funcoes de `useDepartments` para `resources` e `songs`.

Nomes das acoes:

- `createUser`;
- `getAllUsers`;
- `getUserById`;
- `updateUser`;
- `deleteUser`.

## Cuidados importantes

- Nao importar componentes Nuxt dentro de composables se eles nao forem usados.
- Evitar imports mortos, como tipos ou libs sem uso.
- Evitar URLs com barras duplicadas, como `URL_BACKEND}//api`.
- Padronizar nomes de endpoints com o backend.
- Nao montar chamadas HTTP diretamente em paginas quando elas pertencem a um dominio reutilizavel.
- Manter transformacoes de payload dentro do composable quando forem regra de integracao com API.

## Aplicacao no ChurchApp

Com base no backend atual, os primeiros composables recomendados sao:

- `useAuth`: login, sessao, logout e cadastro.
- `useUser`: CRUD de usuario.
- `useCrunch`: CRUD de igreja/tenant.
- `useDepartment`: CRUD de ministerios.
- `useSchedule`: escalas e atribuicoes.
- `useDepartments`: recursos, musicas, cifras e referencias por ministerio.

Esses composables sao a ponte entre as telas e a API real. As novas telas devem reutilizar essa camada em vez de montar chamadas HTTP diretamente nos componentes.
