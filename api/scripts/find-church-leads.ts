// Gera uma lista de leads (igrejas) por regiao usando a API oficial do
// Google Places - so traz dado que a propria igreja publicou no Google
// Business Profile pra ser encontrada (nome, telefone, endereco, site).
// NAO coleta contato pessoal de pastor, NAO envia nada sozinho - a lista sai
// em CSV pra voce revisar e contatar manualmente, um por um, usando os
// scripts de abordagem do playbook de divulgacao.
//
// Uso:
//   npm run leads:find -- "igreja evangelica em Curitiba, PR"
//   npm run leads:find -- "igreja batista em Sao Paulo" --max=120
//
// Requer GOOGLE_PLACES_API_KEY no .env (Google Cloud Console > Places API,
// habilitar cobranca - tem cota gratuita mensal). A API key fica so no
// .env, nunca commitada.

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

interface PlaceSummary {
  place_id: string;
  name: string;
  business_status?: string;
}

interface PlaceDetails {
  name: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  formatted_address?: string;
  website?: string;
  url?: string; // link do Google Maps
  rating?: number;
  user_ratings_total?: number;
}

interface Lead {
  nome: string;
  telefone: string;
  endereco: string;
  site: string;
  googleMaps: string;
  avaliacao: string;
}

function parseArgs(argv: string[]) {
  const query = argv.find((arg) => !arg.startsWith("--"));
  const maxArg = argv.find((arg) => arg.startsWith("--max="));
  const max = maxArg ? Number(maxArg.split("=")[1]) : 60;

  if (!query) {
    console.error(
      'Uso: npm run leads:find -- "igreja evangelica em Curitiba, PR" [--max=60]',
    );
    process.exit(1);
  }

  return { query, max: Number.isFinite(max) && max > 0 ? max : 60 };
}

async function textSearch(query: string, max: number): Promise<PlaceSummary[]> {
  const results: PlaceSummary[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(TEXT_SEARCH_URL);
    url.searchParams.set("key", API_KEY!);
    if (pageToken) {
      url.searchParams.set("pagetoken", pageToken);
      // Google exige um pequeno delay antes do pagetoken ficar valido -
      // isso e um requisito documentado da API, nao evasao de nada.
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } else {
      url.searchParams.set("query", query);
      url.searchParams.set("language", "pt-BR");
      url.searchParams.set("region", "br");
    }

    const response = await fetch(url.toString());
    const data = (await response.json()) as {
      status: string;
      error_message?: string;
      results: PlaceSummary[];
      next_page_token?: string;
    };

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places retornou ${data.status}: ${data.error_message ?? ""}`);
    }

    results.push(...data.results);
    pageToken = data.next_page_token;
  } while (pageToken && results.length < max);

  return results.slice(0, max);
}

async function getDetails(placeId: string): Promise<PlaceDetails> {
  const url = new URL(DETAILS_URL);
  url.searchParams.set("key", API_KEY!);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set(
    "fields",
    [
      "name",
      "formatted_phone_number",
      "international_phone_number",
      "formatted_address",
      "website",
      "url",
      "rating",
      "user_ratings_total",
    ].join(","),
  );

  const response = await fetch(url.toString());
  const data = (await response.json()) as { status: string; result: PlaceDetails };

  if (data.status !== "OK") {
    throw new Error(`Google Places Details retornou ${data.status} para ${placeId}`);
  }

  return data.result;
}

function toCsv(leads: Lead[]): string {
  const header = ["Nome", "Telefone", "Endereço", "Site", "Google Maps", "Avaliação"];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = leads.map((lead) =>
    [lead.nome, lead.telefone, lead.endereco, lead.site, lead.googleMaps, lead.avaliacao]
      .map(escape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

async function main() {
  if (!API_KEY) {
    console.error(
      "GOOGLE_PLACES_API_KEY não definida no .env. Crie uma em https://console.cloud.google.com/ (Places API).",
    );
    process.exit(1);
  }

  const { query, max } = parseArgs(process.argv.slice(2));

  console.log(`Buscando "${query}" no Google Places (até ${max} resultados)...`);
  const summaries = await textSearch(query, max);
  console.log(`${summaries.length} igrejas encontradas. Buscando telefone/endereço de cada uma...`);

  const leads: Lead[] = [];
  for (const [index, place] of summaries.entries()) {
    if (place.business_status === "CLOSED_PERMANENTLY") continue;

    try {
      const details = await getDetails(place.place_id);
      leads.push({
        nome: details.name,
        telefone: details.formatted_phone_number ?? details.international_phone_number ?? "",
        endereco: details.formatted_address ?? "",
        site: details.website ?? "",
        googleMaps: details.url ?? "",
        avaliacao: details.rating
          ? `${details.rating} (${details.user_ratings_total ?? 0} avaliações)`
          : "",
      });
    } catch (err) {
      console.warn(`  falhou pra "${place.name}": ${(err as Error).message}`);
    }

    // Respeita a cota da API - nao ha necessidade de correr, e billing e
    // por request, nao por velocidade.
    await new Promise((resolve) => setTimeout(resolve, 120));
    process.stdout.write(`  ${index + 1}/${summaries.length}\r`);
  }

  const outputDir = join(process.cwd(), "leads");
  mkdirSync(outputDir, { recursive: true });
  const filename = `leads-${query.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${Date.now()}.csv`;
  const outputPath = join(outputDir, filename);
  writeFileSync(outputPath, toCsv(leads), "utf-8");

  console.log(`\nPronto: ${leads.length} contatos salvos em ${outputPath}`);
  console.log(
    "Isso é só a lista - contate cada um manualmente com os scripts de WhatsApp/e-mail do playbook. Nenhuma mensagem foi enviada.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
