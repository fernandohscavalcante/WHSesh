# Relatório executivo — domínio `lojapayjoy.shop`

**Classificação sugerida:** Confidencial — resposta a fraude e proteção de marca<br>
**Data do snapshot técnico:** 29 de setembro de 2026, 14:08:11 UTC<br>
**Público:** C-level, Jurídico, Compliance, Fraud Ops e responsáveis pela resposta a incidentes

## 1. Leitura em um minuto

Em 29 de setembro de 2026, o domínio `lojapayjoy.shop` respondeu publicamente a uma requisição web com sucesso (`HTTP/2 200`). Em termos simples: o endereço continuava acessível na internet no momento da coleta. O nome do domínio usa “PayJoy” e, conforme o dossiê interno que originou esta apuração, é suspeito de imitar a marca e de conduzir pessoas a um fluxo de cobrança fraudulento.

A coleta técnica confirma a existência e a disponibilidade pública do domínio, além de registrar os fornecedores e identificadores visíveis publicamente que podem receber pedidos de remoção e preservação. Ela **não** identifica a pessoa por trás do domínio, não demonstra por si só quem praticou fraude e não acessou sistemas privados do operador. Essas limitações são importantes para que a organização não trate indícios técnicos como uma conclusão de autoria.

**Decisão executiva sugerida:** tratar o site como incidente de alta prioridade de marca e fraude; acionar imediatamente os canais de abuso e preservação de evidência definidos pelo Jurídico; e manter monitoramento técnico passivo até a retirada ou mudança de infraestrutura.

## 2. O que foi confirmado tecnicamente

| Pergunta de negócio | Resposta objetiva | Por que isso importa |
| --- | --- | --- |
| O endereço estava acessível? | Sim. A coleta recebeu `HTTP/2 200` em 29/09/2026 às 14:08 UTC. | Sustenta urgência operacional: potenciais vítimas ainda poderiam alcançar o domínio naquela hora. |
| Para onde o nome apontava? | O endereço principal resolvia para `185.158.133.1`, com validade de DNS de 300 segundos. | É um identificador útil para denúncia e acompanhamento, mas não prova quem controla o conteúdo. |
| Quem administra a zona de nomes? | Os servidores de nomes públicos eram quatro servidores da Name.com. | Direciona a apuração de registro do domínio ao registrador; não revela automaticamente o titular, pois o cadastro pode estar protegido por privacidade. |
| Há sinal público de vínculo com uma plataforma de publicação? | O subdomínio `_lovable` publicou um registro TXT chamado `lovable_verify`. | É um elemento de encaminhamento para a análise/denúncia ao provedor; isoladamente, não prova titularidade da conta ou autoria. |
| Há cronologia pública do domínio? | O RDAP registra criação em 28/07/2026, última alteração em 10/09/2026 e status `transfer prohibited`. | Ajuda a delimitar cronologia e a preservar registros. O status significa apenas que uma transferência de domínio estava bloqueada; não significa que o site tenha sido suspenso. |
| Existem certificados públicos para o endereço? | Sim. As respostas de Certificate Transparency preservadas contêm certificados para o domínio principal e para `www`. | Confirma que certificados foram emitidos e oferece artefatos adicionais para comparação e investigação futura. |

Os arquivos-fonte que suportam essa tabela estão preservados no diretório de evidências do snapshot. O relatório técnico detalhado separa claramente observações de inferências. Consulte o [snapshot técnico](lojapayjoy-technical-status.md) e o [conjunto de evidências](../evidence/lojapayjoy.shop/20260929T140811Z).

## 3. O que estes dados significam — e o que não significam

### Significam

* O domínio estava publicamente ativo no horário indicado e pode ser denunciado com identificadores técnicos específicos.
* Há uma trilha pública mínima para solicitar que provedores preservem os registros sob sua guarda: o registrador do domínio, o provedor que aparece no indicador `_lovable`, o provedor de entrega web mostrado nos cabeçalhos e a autoridade que emitiu os certificados.
* A evidência pode ser reproduzida: cada arquivo coletado possui hash SHA-256 no manifesto `SHA256SUMS`. Um hash funciona como uma “impressão digital” do arquivo: se o arquivo mudar, a conferência deixa de coincidir.

### Não significam

* O IP, os servidores DNS, um registro `_lovable` ou um certificado **não identificam automaticamente** a pessoa física, a empresa operadora ou o beneficiário financeiro.
* A resposta `200` prova que um servidor respondeu ao pedido; ela não prova o conteúdo integral do site, o número de vítimas, dano financeiro ou a intenção do operador.
* O status `transfer prohibited` no RDAP não equivale a bloqueio, remoção ou apreensão do domínio.
* Nenhuma conclusão jurídica, penal ou de responsabilidade deve depender exclusivamente deste snapshot técnico.

## 4. Linha do tempo verificável

| Horário (UTC) | Evento | Fonte preservada |
| --- | --- | --- |
| 28/07/2026 02:47:55 | Evento de registro do domínio informado pelo RDAP. | `rdap-registrar.json` |
| 10/09/2026 04:21:02 | Última alteração informada pelo RDAP. A natureza específica da alteração não aparece no snapshot. | `rdap-registrar.json` |
| 29/09/2026 14:08:11 | Início registrado da coleta técnica passiva. | `00_collection-info.txt` |
| 29/09/2026 14:08:17 | Resposta HTTPS final `HTTP/2 200` preservada. | `http-headers.txt` |

A ordem acima descreve registros públicos observados; ela não estabelece quando o conteúdo alegadamente fraudulento foi publicado nem quem o publicou.

## 5. Ações técnicas recomendadas para decisão e encaminhamento

| Prioridade | Ação | Resultado esperado | Limite técnico/jurídico |
| --- | --- | --- | --- |
| Imediata | Enviar denúncia de abuso ao registrador e ao provedor de publicação/entrega, anexando domínio, data/hora, cabeçalhos, DNS e hashes. | Suspensão do conteúdo ou abertura de caso de abuso; protocolo de atendimento. | Apenas o provedor decide a medida. Solicitar também preservação de logs para autoridade competente. |
| Imediata | Registrar e preservar capturas visuais da página e do fluxo de fraude por meio aprovado pelo Jurídico, com horário e hash. | Evidência da aparência, do uso de marca e da jornada apresentada ao usuário. | Não inserir dados reais, não contratar produto e não efetuar pagamento. |
| Alta | Repetir a coleta passiva em intervalos definidos e comparar os indicadores extraídos de cada coleta (o manifesto de hashes muda a cada execução, porque as respostas trazem carimbos de tempo). | Detectar mudança de IP, DNS, certificados ou disponibilidade sem tocar nos sistemas do operador. | Mudanças de infraestrutura não demonstram autoria; devem ser tratadas como novos indicadores. |
| Alta | Centralizar URLs, identificadores de caso e confirmação de preservação em sistema interno de casos. | Cadeia de custódia e visão única para Jurídico, Fraud Ops e liderança. | Não publicar os artefatos em canais externos ou públicos. |
| Conforme orientação jurídica | Pedir dados não públicos — por exemplo, titularidade, logs e dados de pagamento — somente por canal e instrumento jurídico adequados. | Possível obtenção de dados de atribuição e rastreabilidade financeira. | A equipe técnica não deve tentar contornar controles, consultar backends ou obter esses dados diretamente. |

## 6. Limites observados durante a coleta

A apuração foi propositalmente não intrusiva: limitou-se a consultas DNS públicas, RDAP, Certificate Transparency e uma requisição HTTPS `HEAD` (que pede somente cabeçalhos, e não percorre a página). Não houve envio de formulário, criação de pedido, pagamento Pix, login, tentativa de senha, varredura de vulnerabilidades, enumeração de endpoints nem acesso ao projeto Supabase ou a qualquer API de terceiro.

Esse limite reduz o risco de alteração de evidências, de contato acidental com o operador e de acesso não autorizado. Também explica por que o relatório não afirma conhecer o conteúdo de bancos de dados, a identidade do operador ou informações financeiras não públicas.

## 7. Como ler o anexo técnico

| Termo | Explicação sem jargão |
| --- | --- |
| Domínio | O nome digitado no navegador, como `lojapayjoy.shop`. |
| DNS | O “catálogo de endereços” da internet que associa um nome a uma infraestrutura técnica. |
| IP | Endereço numérico usado para alcançar um servidor ou serviço na internet. Pode ser compartilhado por vários sites. |
| RDAP | Registro público padronizado sobre o domínio: registrador, datas, status e, quando disponível, contatos. Dados do titular podem ser ocultados por privacidade. |
| Certificate Transparency (CT) | Registro público de certificados HTTPS emitidos. Ele mostra emissão de certificado, não autoria do site. |
| Cabeçalho HTTP | Metadados da resposta de um site, como código de disponibilidade e alguns provedores envolvidos. |
| SHA-256 | Código matemático usado para verificar se um arquivo preservado continua exatamente igual. |

## 8. Integridade e localização dos arquivos

O diretório [`evidence/lojapayjoy.shop/20260929T140811Z`](../evidence/lojapayjoy.shop/20260929T140811Z) contém as respostas brutas e o arquivo `SHA256SUMS`. O manifesto cobre cada evidência do diretório, exceto o próprio manifesto. A captura de cabeçalhos deliberadamente exclui o `Set-Cookie`, pois esse valor pode carregar token temporário de proteção contra bots e não é necessário para demonstrar a disponibilidade do endereço.

Antes de apoiar qualquer medida neste snapshot, o Jurídico deve considerar as [limitações conhecidas](lojapayjoy-technical-status.md#known-limitations-of-snapshot-20260929t140811z) descritas no relatório técnico: a versão do coletor que o produziu não está preservada no repositório, e o arquivo de cabeçalhos contém, antes da resposta do domínio, um bloco compatível com a resposta do proxy de saída do ambiente de coleta.

Os achados da coleta ampliada de 29/09/2026 (uso da marca, cópia de texto da loja oficial, fluxo de pagamento, infraestrutura e canais de denúncia) estão no [registro OSINT](registro-osint-lojapayjoy-20260929.md).

Para nova coleta passiva, a equipe técnica pode executar o coletor documentado no [relatório técnico](lojapayjoy-technical-status.md#reproducible-passive-collection). Ele fixa o alvo no domínio deste caso e cria um novo diretório UTC; não foi desenhado como ferramenta genérica de investigação.
