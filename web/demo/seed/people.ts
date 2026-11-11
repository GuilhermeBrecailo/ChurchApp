// Pessoas da Igreja Batista Esperança (Curitiba-PR). Os ids são estáveis e
// usados por todos os outros arquivos de seed/handlers.

export interface SeedPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** "MM-DD" relativo: undefined = sem data; "today"/"+N" = aniversário daqui a N dias */
  birth?: { year: number; offsetDays?: number; monthDay?: string };
  churchRole?: "PASTOR" | "MEMBER";
  canManageMembers?: boolean;
  /** dias desde que entrou na igreja */
  joinedDaysAgo: number;
  /** pedido de entrada pendente (sem acesso ainda) */
  pending?: boolean;
}

export const PEOPLE: SeedPerson[] = [
  { id: "u-pastor", name: "Marcos Oliveira", email: "pr.marcos@esperanca.org.br", phone: "(41) 99812-3401", birth: { year: 1978, monthDay: "03-14" }, churchRole: "PASTOR", canManageMembers: true, joinedDaysAgo: 2900 },
  { id: "u-helena", name: "Helena Oliveira", email: "helena.oliveira@email.com", phone: "(41) 99812-3402", birth: { year: 1981, monthDay: "07-22" }, canManageMembers: true, joinedDaysAgo: 2900 },
  { id: "u-ana", name: "Ana Paula Souza", email: "anapaula.louvor@email.com", phone: "(41) 99645-1180", birth: { year: 1990, monthDay: "05-09" }, joinedDaysAgo: 1800 },
  { id: "u-lucas", name: "Lucas Ferreira", email: "lucas.ferreira@email.com", phone: "(41) 98733-2045", birth: { year: 1999, monthDay: "09-30" }, joinedDaysAgo: 540 },
  { id: "u-gabriel", name: "Gabriel Santos", email: "gabriel.bateria@email.com", phone: "(41) 99120-7788", birth: { year: 1988, monthDay: "01-17" }, joinedDaysAgo: 1500 },
  { id: "u-beatriz", name: "Beatriz Lima", email: "bia.lima@email.com", phone: "(41) 99877-6612", birth: { year: 1999, offsetDays: 0 }, joinedDaysAgo: 1200 },
  { id: "u-rafael", name: "Rafael Costa", email: "rafael.teclas@email.com", phone: "(41) 98455-0931", birth: { year: 1985, monthDay: "11-02" }, joinedDaysAgo: 1650 },
  { id: "u-camila", name: "Camila Rocha", email: "camila.rocha@email.com", phone: "(41) 99702-4417", birth: { year: 1993, offsetDays: 5 }, joinedDaysAgo: 980 },
  { id: "u-thiago", name: "Thiago Almeida", email: "thiago.midia@email.com", phone: "(41) 99230-5521", birth: { year: 1995, monthDay: "04-25" }, joinedDaysAgo: 1100 },
  { id: "u-larissa", name: "Larissa Mendes", email: "larissa.mendes@email.com", phone: "(41) 98810-3366", birth: { year: 2001, monthDay: "08-13" }, joinedDaysAgo: 420 },
  { id: "u-pedro", name: "Pedro Henrique Dias", email: "pedro.dias@email.com", phone: "(41) 99655-9002", birth: { year: 1983, monthDay: "06-06" }, joinedDaysAgo: 2100 },
  { id: "u-mariana", name: "Mariana Carvalho", email: "mari.carvalho@email.com", phone: "(41) 99104-2278", birth: { year: 1997, offsetDays: 12 }, joinedDaysAgo: 760 },
  { id: "u-joao", name: "João Batista Pereira", email: "joao.diacono@email.com", phone: "(41) 98877-4410", birth: { year: 1962, monthDay: "02-28" }, joinedDaysAgo: 2900 },
  { id: "u-roberto", name: "Roberto Nascimento", email: "roberto.nasc@email.com", phone: "(41) 99543-8120", birth: { year: 1975, monthDay: "10-19" }, joinedDaysAgo: 2400 },
  { id: "u-sandra", name: "Sandra Martins", email: "tia.sandra@email.com", phone: "(41) 99366-1205", birth: { year: 1970, monthDay: "12-03" }, joinedDaysAgo: 2600 },
  { id: "u-fernanda", name: "Fernanda Gomes", email: "fernanda.gomes@email.com", phone: "(41) 98290-6633", birth: { year: 1989, monthDay: "03-01" }, joinedDaysAgo: 1300 },
  { id: "u-daniel", name: "Daniel Araújo", email: "daniel.araujo@email.com", phone: "(41) 99811-0457", birth: { year: 1992, monthDay: "07-07" }, joinedDaysAgo: 890 },
  { id: "u-patricia", name: "Patrícia Freitas", email: "patricia.freitas@email.com", phone: "(41) 99470-3318", birth: { year: 1968, monthDay: "05-30" }, joinedDaysAgo: 2750 },
  { id: "u-vinicius", name: "Vinícius Barbosa", email: "vini.barbosa@email.com", phone: "(41) 98602-7745", birth: { year: 2003, monthDay: "01-05" }, joinedDaysAgo: 300 },
  { id: "u-aline", name: "Aline Teixeira", email: "aline.teixeira@email.com", phone: "(41) 99318-2290", birth: { year: 1994, monthDay: "09-12" }, joinedDaysAgo: 640 },
  // Pedidos de entrada pelo link de convite, aguardando o pastor aprovar.
  { id: "u-juliana", name: "Juliana Ribeiro", email: "juliana.ribeiro@email.com", phone: "(41) 99921-4470", birth: { year: 1996, monthDay: "08-20" }, joinedDaysAgo: 1, pending: true },
  { id: "u-eduardo", name: "Eduardo Moraes", email: "edu.moraes@email.com", phone: "(41) 98544-1093", birth: { year: 1987, monthDay: "04-11" }, joinedDaysAgo: 3, pending: true },
];

/** Pessoas só no rol (sem conta no app). */
export interface SeedRosterOnly {
  id: string;
  name: string;
  phone: string | null;
  email?: string | null;
  status: "VISITOR" | "MEMBER" | "FORMER";
  birth?: { year: number; offsetDays?: number; monthDay?: string };
  notes?: string;
  createdDaysAgo: number;
}

export const ROSTER_ONLY: SeedRosterOnly[] = [
  { id: "r-cida", name: "Aparecida Lopes (Dona Cida)", phone: "(41) 3344-2810", status: "MEMBER", birth: { year: 1949, offsetDays: 20 }, notes: "Não usa celular. Prefere ligação no fixo.", createdDaysAgo: 2900 },
  { id: "r-antonio", name: "Antônio Lopes", phone: "(41) 3344-2810", status: "MEMBER", birth: { year: 1946, offsetDays: 3 }, notes: "Esposo da Dona Cida. Mobilidade reduzida.", createdDaysAgo: 2900 },
  { id: "r-kleber", name: "Kleber Duarte", phone: "(41) 99782-6610", email: "kleber.duarte@email.com", status: "MEMBER", birth: { year: 1984, monthDay: "06-18" }, notes: "Perdeu o emprego em setembro.", createdDaysAgo: 1400 },
  { id: "r-simone", name: "Simone Duarte", phone: "(41) 99782-6611", status: "MEMBER", birth: { year: 1986, monthDay: "02-02" }, createdDaysAgo: 1400 },
  { id: "r-marta", name: "Marta Silveira", phone: "(41) 99012-3487", status: "FORMER", notes: "Mudou-se para Joinville.", createdDaysAgo: 2000 },
  // Visitantes em etapas diferentes do acompanhamento
  { id: "r-renata", name: "Renata Campos", phone: "(41) 99877-0021", email: "renata.campos@email.com", status: "VISITOR", createdDaysAgo: 3 },
  { id: "r-felipe", name: "Felipe Moura", phone: "(41) 98455-7710", status: "VISITOR", createdDaysAgo: 10 },
  { id: "r-igor", name: "Igor Santana", phone: "(41) 99630-4452", email: "igor.santana@email.com", status: "VISITOR", createdDaysAgo: 24 },
  { id: "r-tatiane", name: "Tatiane Prado", phone: "(41) 99201-8890", email: "tati.prado@email.com", status: "MEMBER", createdDaysAgo: 60 },
];

export interface SeedChild {
  id: string;
  name: string;
  age: number;
  group: "Maternal (3 a 5)" | "Primários (6 a 9)";
  guardians: string[];
}

export const CHILDREN: SeedChild[] = [
  { id: "r-miguel", name: "Miguel Santos", age: 6, group: "Primários (6 a 9)", guardians: ["r-u-gabriel"] },
  { id: "r-alice", name: "Alice Santos", age: 4, group: "Maternal (3 a 5)", guardians: ["r-u-gabriel"] },
  { id: "r-helenac", name: "Helena Costa", age: 7, group: "Primários (6 a 9)", guardians: ["r-u-rafael"] },
  { id: "r-theo", name: "Theo Rocha", age: 5, group: "Maternal (3 a 5)", guardians: ["r-u-camila"] },
  { id: "r-laura", name: "Laura Dias", age: 8, group: "Primários (6 a 9)", guardians: ["r-u-pedro"] },
  { id: "r-davi", name: "Davi Duarte", age: 6, group: "Primários (6 a 9)", guardians: ["r-kleber", "r-simone"] },
  { id: "r-sofia", name: "Sofia Gomes", age: 9, group: "Primários (6 a 9)", guardians: ["r-u-fernanda"] },
  { id: "r-arthur", name: "Arthur Nascimento", age: 3, group: "Maternal (3 a 5)", guardians: ["r-u-roberto"] },
];

/** id do rol de quem tem conta */
export const rosterIdForUser = (userId: string) => `r-${userId}`;
