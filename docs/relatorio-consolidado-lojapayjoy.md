# Relatório consolidado de achados: domínio `lojapayjoy.shop`

**Classificação sugerida:** Confidencial, resposta a fraude e proteção de marca<br>
**Data de referência:** 29 de setembro de 2026 (coletas entre 11:08 e 12:57, horário de Brasília)<br>
**Público:** liderança executiva, Jurídico e Compliance<br>
**Relação com o [relatório executivo original](relatorio-executivo-lojapayjoy.md):** este documento reúne somente o que foi apurado depois dele e ainda não consta nele.

Salvo indicação, os horários estão no horário de Brasília (UTC-3). A fundamentação técnica de cada afirmação está no [registro OSINT](registro-osint-lojapayjoy-20260929.md) e no [snapshot técnico](lojapayjoy-technical-status.md); este relatório traduz esses achados para a tomada de decisão.

## 1. Resumo para decisão

O site `lojapayjoy.shop` se apresenta como PayJoy, reproduz textos da loja oficial, dirige a oferta a pessoas com restrição de crédito e cobra por Pix um valor cujo recebedor não aparece em nenhuma fonte pública. Em 29/09/2026, nem o Google nem as listas públicas de phishing consultadas alertavam o consumidor sobre o site.

**Principais conclusões**

1. **A imitação da marca está comprovada.** O site declara ser a PayJoy no título das páginas, nos dados que envia a buscadores e redes sociais e no rodapé ("© 2026 Payjoy Brazil"), usa o logotipo e copia literalmente ao menos 14 frases da loja oficial `loja.payjoy.com`. O próprio endereço imita o da loja oficial: `loja.payjoy.com` tornou-se `lojapayjoy.shop`.
2. **A isca é dirigida a negativados.** Os trechos que não existem no site oficial são os que atraem pessoas com restrição de crédito ("Aprovação imediata para negativados") e concentram a verificação no CPF.
3. **O destino do dinheiro não é visível.** O código Pix é gerado no servidor do site no momento do pagamento. O recebedor só pode ser identificado pelo comprovante de uma vítima ou por requisição aos provedores.
4. **Cinco entidades sustentam o site, e cada uma pode agir.** São elas o registrador do nome (Name.com), a plataforma que criou e hospeda o site (Lovable, por indícios convergentes), o serviço de banco de dados (Supabase), a rede de entrega (Cloudflare) e o titular do bloco de endereços IP. Todas têm canal de denúncia identificado; nenhuma foi acionada por nós.
5. **O público não está protegido.** O Google informava "Nenhum conteúdo não seguro foi encontrado" (última verificação em 10/09/2026), e o site pede para ser indexado por buscadores. Quem o acessa não recebe alerta.
6. **A prova original tem duas fragilidades, contornadas em parte.** O programa que gerou o primeiro snapshot não foi preservado, e um dos arquivos contém dados do ambiente de coleta. As coletas novas registram essas informações, mas também foram feitas de fora do Brasil; uma coleta formal no país fecha a lacuna.
7. **Ainda não sabemos** quem opera o site, quem recebe os pagamentos, quantas vítimas existem e por qual canal elas chegam ao site. Buscas na web não encontraram reclamações públicas associadas ao domínio, o que não significa ausência de vítimas.

**Decisões sugeridas**

* Registrar formalmente o site, com fé pública, **antes** de acionar as denúncias: uma denúncia bem-sucedida tira o site do ar e impede o registro posterior.
* Autorizar o Jurídico a acionar em seguida, em paralelo, os canais de denúncia e preservação listados na seção 5.
* Criar um canal para receber relatos e comprovantes de vítimas, que são hoje o caminho mais curto para identificar o recebedor dos pagamentos.

## 2. O que mudou em relação ao relatório original

| Tema | No relatório original | Situação atual | Por que importa |
| --- | --- | --- | --- |
| Uso da marca | Suspeita, "conforme o dossiê interno". | Imitação documentada: título, metadados, logotipo, rodapé e 14 frases copiadas da loja oficial. | Converte a suspeita em prova material de uso indevido de marca. |
| Público-alvo | Não tratado. | Oferta dirigida a negativados, com verificação "apenas pelo CPF". | Define o perfil das vítimas e indica coleta de dados pessoais. |
| Pagamento | "Fluxo de cobrança fraudulento", segundo o dossiê. | Pix "copia e cola" e QR Code gerados no servidor do site; recebedor oculto. | Define como identificar o destino do dinheiro. |
| Hospedagem | Registro `_lovable` tratado como "elemento de encaminhamento". | Quatro indícios independentes apontam a Lovable; banco de dados no Supabase; rede da Cloudflare. | Define a quem pedir retirada e preservação. |
| Endereço IP | "Identificador útil", sem prova de controle. | O IP é compartilhado com sites sem relação e registrado em nome genérico ("Private Customer"). | Confirma que o IP não identifica o operador; o caminho é a plataforma. |
| Proteção do público | Não tratado. | Google sem alerta; site aberto a buscadores; ausente das listas públicas de phishing consultadas. | Justifica denúncia imediata ao Google e à Cloudflare. |
| Datas | Registro em 28/07/2026 (UTC). | Em Brasília, o registro ocorreu em **27/07/2026, às 23:47**. O domínio vale até 28/07/2027; os certificados de segurança vencem na virada de 25 para 26/10/2026. | Datas corretas no fuso local para peças jurídicas; prazos de monitoramento. |
| Status "transfer prohibited" | Explicado como não sendo suspensão. | É uma trava aplicada pelo próprio registrador; o registro público não mostra nenhuma medida de bloqueio ou suspensão. | Nenhuma providência de terceiro recaía sobre o domínio em 29/09/2026. |
| Qualidade da prova original | Apresentada sem ressalvas. | Duas fragilidades de cadeia de custódia identificadas (seção 3.6). | O Jurídico deve considerá-las antes de usar o snapshot original isoladamente. |

## 3. Achados explicados

### 3.1 O site se faz passar pela PayJoy

A marca aparece em três camadas. Na camada visível ao consumidor, as páginas exibem o logotipo "PAYJOY", a identidade visual verde, o título "PayJoy" na aba do navegador e o rodapé "© 2026 Payjoy Brazil". Na camada que o consumidor não vê, o código da página declara "PayJoy" como autor, como nome do site e como nome da organização. Esses são os dados que buscadores, redes sociais e aplicativos de mensagem costumam usar para montar a prévia de um link compartilhado. Na terceira camada, o site aponta para perfis de redes sociais com o nome PayJoy (`facebook.com/payjoy` e `instagram.com/payjoy`); não verificamos se são os perfis oficiais.

A comparação com a loja oficial `loja.payjoy.com`, preservada no mesmo dia, mostra ao menos 14 frases idênticas, entre elas "Seu celular novo está mais perto do que você imagina", "Entrada e parcelas fixas a cada 14 dias em até 9 meses" e "Mais de 20 milhões de pessoas já compraram seu celular parcelado com a PayJoy". Até o texto do rodapé sobre preferências de coleta de dados coincide. Isso indica que a página oficial foi copiada como um todo e depois alterada; essa é uma inferência a partir da coincidência.

As capturas de tela das páginas estão preservadas (Anexo B) e podem ser usadas em notificações e denúncias de marca.

### 3.2 A quem o site se dirige

Os trechos acrescentados em relação à loja oficial formam a isca:

* "Aprovação imediata para negativados";
* "A verificação usa apenas o seu CPF. A confirmação final acontece na etapa do cadastro.";
* "Você só precisa informar o seu CPF: a consulta é feita na hora, sem enviar documentos.";
* três depoimentos com nome e foto de pessoas que relatam aprovação apesar de restrição de crédito. Não verificamos a autenticidade dos depoimentos; as fotos podem pertencer a terceiros sem relação com o caso.

O catálogo lista 16 aparelhos das marcas Samsung, Motorola, Realme, TCL e Honor, com "valor a ser financiado" entre R$ 629 e R$ 1.889, entrada estimada (R$ 165 no aparelho examinado) e avisos de escassez como "Só 3 em estoque".

**Risco adicional:** além do pagamento, o próprio site anuncia que pede o CPF, e o código do checkout consulta CEP, o que indica coleta de endereço. Dados assim coletados podem ser usados em outras fraudes contra as mesmas pessoas. Isso é uma avaliação de risco, não um fato observado.

### 3.3 Como a cobrança funciona e por que o recebedor não aparece

O código do site é público: todo navegador que abre a página o recebe. A leitura desse código, sem executá-lo, mostra o percurso da vítima: escolha do aparelho, cadastro (com consulta de CEP), tela de pagamento com QR Code e código Pix "copia e cola", e tela de confirmação.

O código Pix não está no código público. Ele é criado no servidor do site no instante do pagamento, por duas funções cujos identificadores estão no Anexo A. Por isso não há como descobrir o recebedor sem uma de duas fontes:

* **o comprovante de uma vítima**, que normalmente identifica o recebedor e a instituição de pagamento; ou
* **requisição aos provedores** (seção 3.4), que guardam os registros dessas funções e da conta que as criou.

Não simulamos uma compra. Isso exigiria fornecer dados pessoais, poderia alertar o operador e caracterizaria interação com a fraude.

### 3.4 Quem mantém o site no ar

| Função (em termos simples) | Entidade | Como sabemos | O que a empresa pode fazer | Canal de denúncia |
| --- | --- | --- | --- | --- |
| Registro do nome do site (como o cartório do nome) | Name.com | Registro público do domínio. O titular está oculto por serviço de privacidade. | Suspender o domínio; preservar os dados do titular. | `abuse@name.com` |
| Criação e hospedagem do site (o imóvel onde o site funciona) | Lovable, plataforma de criação de sites | Inferência a partir de quatro indícios convergentes: registro de verificação `_lovable`, nome do servidor `lovable-app-…`, caminhos de arquivos próprios da plataforma e referências no código. A Lovable não confirmou. | Retirar o site; preservar conta, projeto, acessos e registros das funções de pagamento. | Formulário `lovable.dev/abuse/report`; para marca, `lovable.dev/abuse/trademark` |
| Banco de dados e servidor de apoio (o arquivo onde ficam os cadastros) | Supabase, projeto `dvetcwjilckliooltfwg` | Endereço do projeto no código do site. | Suspender o projeto; preservar dados de vítimas e registros de acesso. | `abuse@supabase.com` |
| Rede de entrega (a estrada e a portaria por onde passa cada acesso) | Cloudflare | Registros públicos de roteamento e cabeçalhos das respostas do site. | Segundo a documentação da própria Cloudflare, após confirmar o phishing ela exibe uma página de alerta aos visitantes e notifica o dono do site. | Formulário `abuse.cloudflare.com` (phishing) |
| Titular do bloco de endereços IP | Registrado como "Private Customer" | Registro público do bloco no RIPE. | Alcance limitado: o mesmo IP atende outros sites. | `report@abuseradar.com` |

Fora dessa cadeia, o **Google Safe Browsing** decide se Chrome e a Pesquisa Google exibem alerta sobre o site; a denúncia é feita na página "Report a Page to Google Safe Browsing".

### 3.5 Exposição do público

Em 29/09/2026, o Google Transparency Report exibia "Nenhum conteúdo não seguro foi encontrado" para o domínio, com última atualização em 10/09/2026. O site instrui os buscadores a indexá-lo. Ele não constava do serviço público de análise urlscan.io nem da lista pública de phishing OpenPhish, e, segundo consulta ao Internet Archive que não pôde ser preservada, não havia cópia arquivada dele. Buscas na web não encontraram reclamações de vítimas associadas ao domínio.

Nada impedia um consumidor de chegar ao site e pagar sem receber alerta. A ausência de reclamações públicas pode refletir a idade recente do site ou vítimas que não registraram queixa; não permite estimar o número de afetados.

### 3.6 Ressalvas sobre a prova do relatório original

Estes pontos interessam ao Jurídico antes de usar o snapshot original em qualquer peça:

1. **O programa que gerou o snapshot original não foi preservado.** O arquivo de identificação da coleta traz um formato diferente do produzido pelo programa salvo junto com ele. Não é possível demonstrar exatamente como os arquivos foram produzidos. Os dados em si (endereços, registro do domínio, certificados) foram confirmados pela coleta nova, feita cerca de uma hora e vinte minutos depois.
2. **Parte de um arquivo veio do ambiente de coleta, não do site.** O arquivo de cabeçalhos contém uma resposta do intermediário de rede do ambiente usado na primeira coleta, e dois dados técnicos que poderiam ser atribuídos ao site provavelmente vieram desse intermediário: a coleta nova, feita por outro caminho, não os recebeu e mostra que o site responde pela Cloudflare. Esses dois dados não devem ser tratados como características do site.
3. **O status "transfer prohibited" é uma trava do registrador.** Pela norma técnica do registro de domínios (RFC 5731, seção 2.3), status com o prefixo "client" são aplicados e retirados pelo registrador. Não se trata de medida de autoridade.
4. **As datas iniciais dos certificados antecedem o registro em 14 a 21 minutos.** Essas datas são fixadas pela emissora do certificado e não provam atividade anterior ao registro do domínio.
5. **As fontes públicas divergem em detalhes.** O registrador e o registro diferem em um segundo no horário de criação do domínio e informam telefones de abuso diferentes para a Name.com; o e-mail de abuso é o mesmo.
6. **As coletas novas também têm limites.** Foram feitas a partir de um ambiente fora do Brasil, com um intermediário que inspeciona conexões criptografadas; os arquivos registram essa condição. Um site fraudulento pode mostrar conteúdo diferente a visitantes brasileiros ou de redes móveis, e isso não foi testado. Uma coleta formal no Brasil, com fé pública, supre essas lacunas.

## 4. Linha do tempo atualizada

| Data e hora (Brasília) | Evento | Situação |
| --- | --- | --- |
| 27/07/2026, 23:26 a 23:33 | Datas iniciais dos certificados de segurança do site. Fixadas pela emissora; não provam atividade anterior ao registro. | Novo |
| 27/07/2026, 23:47 | Registro do domínio na Name.com (28/07, 02:47 UTC). | Constava em UTC; agora no horário de Brasília |
| 10/09/2026, 01:21 | Última alteração no registro do domínio; a natureza da alteração não é pública. | Constava em UTC; agora no horário de Brasília |
| 10/09/2026 | Última verificação do Google Safe Browsing: nenhum conteúdo inseguro. | Novo |
| 29/09/2026, 11:08 | Snapshot original. | Constava em UTC |
| 29/09/2026, 12:27 a 12:57 | Coleta ampliada: site no ar, com a marca PayJoy e o catálogo completo. | Novo |
| Virada de 25 para 26/10/2026 | Vencimento dos certificados de segurança. Uma renovação indicará que o site segue ativo. | Novo |
| 28/07/2027, 20:59 | Vencimento do registro do domínio, se não for renovado. | Novo |

## 5. Ações recomendadas

As ações abaixo não substituem as do relatório original; detalham e ordenam as que dependem dos achados novos. Os textos das denúncias e requisições cabem ao Jurídico.

| Prioridade | Ação | Responsável sugerido | Resultado esperado | Cuidado |
| --- | --- | --- | --- | --- |
| 1. Imediata, antes das denúncias | Registrar as páginas com fé pública (ata notarial ou perícia), a partir de conexão brasileira, em computador e celular. | Jurídico | Prova apta a uso judicial, sem as ressalvas das coletas técnicas. | Denúncias podem derrubar o site; registrar antes. Não inserir dados nem pagar. |
| 2. Imediata | Denunciar à Cloudflare na categoria phishing. | Jurídico ou Fraud Ops | Página de alerta aos visitantes e notificação ao operador. | A denúncia exige o domínio e o link da página. |
| 3. Imediata | Denunciar à Lovable (abuso e marca), ao Supabase e à Name.com, com pedido de preservação de registros. | Jurídico | Retirada do site; preservação de conta, acessos e registros de pagamento. | Os identificadores estão no Anexo A. A decisão cabe a cada provedor. |
| 4. Imediata | Denunciar ao Google Safe Browsing. | Fraud Ops | Alerta no Chrome e na Pesquisa Google. | Anexar capturas de tela. |
| 5. Alta | Abrir canal para relatos e comprovantes de vítimas. | Atendimento e Compliance | Identificação do recebedor do Pix e dimensionamento dos afetados. | Tratar os dados das vítimas conforme orientação do Jurídico. |
| 6. Alta | Manter o monitoramento técnico: repetir as coletas e acompanhar a virada de 25 para 26/10/2026. | Equipe técnica | Detectar mudança de endereço, de plataforma ou de certificados, e novos domínios. | A busca por domínios parecidos feita até aqui não é exaustiva; um serviço especializado de monitoramento de marca cobre essa lacuna. |
| 7. Conforme orientação jurídica | Requisições judiciais: titular do domínio (Name.com), conta e acessos (Lovable), projeto e registros (Supabase), recebedor dos Pix (instituição identificada pelo comprovante). | Jurídico | Dados de autoria e rastreamento financeiro. | Solicitar preservação antes, para evitar descarte de registros. |

## 6. Limites e perguntas em aberto

**Não foi feito, por decisão de escopo:** simular compra, informar CPF ou qualquer dado, abrir as telas de pagamento, gerar Pix, consultar o banco de dados do site, testar vulnerabilidades ou pesquisar pessoas.

**Não foi feito, por restrição do ambiente de trabalho:** a leitura das datas de envio dos arquivos de imagem, que estão gravadas no código do site. Os arquivos estão preservados íntegros e podem ser examinados por perito; essas datas podem precisar a cronologia de montagem do site.

**Perguntas em aberto:**

* Quem opera o site?
* Quem recebe os pagamentos, e em qual instituição?
* Quantas pessoas pagaram?
* Por qual canal as vítimas chegam ao site (anúncios, redes sociais, mensagens)?
* O site mostra o mesmo conteúdo a visitantes no Brasil?

## 7. Glossário dos termos novos

| Termo | Explicação sem jargão |
| --- | --- |
| Plataforma de criação de sites | Serviço que monta e hospeda um site a partir de instruções do usuário, sem que ele precise programar. |
| Banco de dados | Onde o site guarda informações, como cadastros e pedidos. |
| Rede de entrega | Empresa por cuja rede passa cada acesso ao site; pode bloquear ou alertar. |
| Metadados | Informações embutidas na página, invisíveis ao leitor, usadas por buscadores e redes sociais. |
| Pix "copia e cola" | Código que a vítima cola no aplicativo do banco para pagar; ao lê-lo, o aplicativo mostra o recebedor antes da confirmação. |
| Intermediário de rede (proxy) | Equipamento pelo qual passa o tráfego de um ambiente de coleta; pode alterar ou acrescentar dados técnicos. |
| Snapshot | Conjunto de arquivos coletados num mesmo momento, com um manifesto de "impressões digitais" (hashes) que revela qualquer alteração posterior. |

## Anexo A. Identificadores para denúncias e pedidos de preservação

| Destinatário | Identificador | Valor |
| --- | --- | --- |
| Todos | Endereço do site | `https://lojapayjoy.shop/` |
| Name.com | Identificador do domínio no registro | `DO18394215-GMO` |
| Lovable | Token de verificação do domínio | `lovable_verify=096049e5c4d1338fb24a7cd4d5088a31da41900e39deb37cc59627ee332246ed` |
| Lovable | Identificador da implantação do site | `psr2.ace2fd78-4659-466d-8532-e48ac1fde1c3` |
| Lovable | Nome do servidor | `lovable-app-cd-1-4.p.l5e.io` |
| Lovable (servidor do site); Supabase, se as funções usarem o banco de dados | Funções que geram o pagamento | `85a7da13ce7fdaba6b1e1edac497a7cc5455cf15bdf57dbd1be6c4e29433c09d` e `26271183a9c63e54d57769c944c5ee6fabaad5c477c148b15792cb9ccd66f315` |
| Supabase | Projeto | `dvetcwjilckliooltfwg` (`https://dvetcwjilckliooltfwg.supabase.co`) |
| Cloudflare | Endereço IP e rede | `185.158.133.1`, rede AS13335 |
| Cloudflare | Identificadores de acesso com horário | `a42b8f111dab9d53-ORD` (29/09/2026, 11:08:17) e `a42c03ffc9aa3976-IAD` (29/09/2026, 12:28:06) |
| Titular do bloco IP | Bloco de endereços | `185.158.133.0/24` (`DET-FRA-CUSTOMERS`) |

## Anexo B. Onde estão as provas

Cada conjunto de arquivos tem um manifesto de hashes; o valor abaixo identifica o conjunto inteiro. A equipe técnica confere a integridade de todos com `./scripts/verify_evidence.sh`, que acusa qualquer arquivo alterado, removido ou acrescentado.

| Conjunto | Conteúdo | Hash do manifesto |
| --- | --- | --- |
| `evidence/lojapayjoy.shop/20260929T140811Z` | Snapshot original (com as ressalvas da seção 3.6). | `adfb92bd042e6a69635955e2e1c2d894488687d3060a0f4d32da6cb5db77932b` |
| `evidence/lojapayjoy.shop/20260929T152729Z` | Nova coleta dos registros públicos do domínio e da rede. | `289c6adb64092e002e5d9fe45f3476abcea665a30fd6aa48fc4faae7fbd07101` |
| `evidence/lojapayjoy.shop-osint/20260929T153028Z` | Consultas a fontes de terceiros, sem contato com o site. | `6ab9d36de84d459b6b744d79ff9fcb1ff88b61865c0939b849698f0bb97d7052` |
| `evidence/lojapayjoy.shop-web/20260929T155023Z` | Capturas de tela, páginas e código do site. | `fa70673247f1e43e895130dded6cf3f2add523fc53e46323f77864ed173ef63b` |
| `evidence/lojapayjoy.shop-web/20260929T153617Z` | Primeira tentativa de captura, incompleta; mantida por integridade. | `8eeb9d9ff286d6b0c626e5a76339d892b8372ff8af17e45a981e145d5289d0fa` |
| `evidence/lojapayjoy.shop-reputation/20260929T155256Z` | Página do Google Safe Browsing sobre o domínio. | `48a23a18910b83316b826e1e17407b53c62da6af504ca34c976cf0c49046ee4c` |
| `evidence/payjoy-official-reference/20260929T155629Z` | Página da loja oficial, para comparação. | `a18594ec1a6dfae88b6ddf8773ef798975023700dc8e516d4d995eb88e0f73f1` |

As capturas de tela e o código preservados contêm fotos de pessoas usadas nos depoimentos e devem ser tratados como dados pessoais ao serem compartilhados.

## Fontes externas consultadas em 29/09/2026

* Lovable, página de denúncia de abuso: `https://lovable.dev/abuse`
* Supabase, página de contato (canal de abuso): `https://supabase.com/contact-us`
* Cloudflare, tipos de denúncia e tratamento de phishing: `https://developers.cloudflare.com/fundamentals/reference/report-abuse/complaint-types/`
* Google, página "Report a Page to Google Safe Browsing": `https://safebrowsing.google.com/safebrowsing/report_phish/`
* RFC 5731 (norma do registro de domínios), seção 2.3: `https://www.rfc-editor.org/rfc/rfc5731.txt`
