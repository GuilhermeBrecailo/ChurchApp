## ADDED Requirements

### Requirement: Upload da foto/logo da igreja num lugar claro
O admin SHALL oferecer, na seção de aparência da igreja, um lugar para enviar a foto/logo da igreja, que passa a ser usada na página pública.

#### Scenario: Enviar a logo
- **WHEN** o pastor envia uma imagem como logo na seção de aparência
- **THEN** a logo é salva e aparece na página pública

### Requirement: Personalizar cor do texto e estilo de fonte
A igreja SHALL poder escolher a cor do texto e um estilo de fonte, a partir de um conjunto curado de fontes já disponíveis, aplicados à página pública.

#### Scenario: Trocar a fonte
- **WHEN** o pastor escolhe uma fonte da lista e salva
- **THEN** a página pública passa a usar essa fonte

#### Scenario: Trocar a cor do texto
- **WHEN** o pastor escolhe uma cor de texto e salva
- **THEN** a página pública usa essa cor no texto

#### Scenario: Fonte fora da lista é rejeitada
- **WHEN** chega um valor de fonte fora do conjunto permitido
- **THEN** o sistema ignora/rejeita e mantém a fonte padrão

### Requirement: Aparência agrupada
As opções de aparência (logo, cor de destaque, cor do texto, fonte) SHALL ficar juntas numa mesma seção.

#### Scenario: Seção de aparência
- **WHEN** o pastor abre a seção de aparência
- **THEN** vê logo, cor de destaque, cor do texto e fonte no mesmo lugar
