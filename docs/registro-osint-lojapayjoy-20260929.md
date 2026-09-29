# Registro OSINT: `lojapayjoy.shop` (29/09/2026)

**Classificação sugerida:** Confidencial, resposta a fraude e proteção de marca<br>
**Janela de coleta:** 29/09/2026, 15:27 a 15:57 UTC<br>
**Complementa:** [relatório executivo](relatorio-executivo-lojapayjoy.md) e [snapshot técnico](lojapayjoy-technical-status.md)

Cada afirmação abaixo indica o arquivo que a sustenta. Os caminhos são relativos ao diretório do snapshot citado na seção 2. Onde há inferência, o texto diz que é inferência.

## 1. Escopo executado e limites

**Executado:** DNS por dois resolvedores (Cloudflare e Google), RDAP do domínio, do IP e do ASN, dados de roteamento e registro do RIPEstat, Shodan InternetDB (dados já coletados pelo Shodan; nenhuma varredura foi feita), Certificate Transparency com download dos certificados, busca por nomes semelhantes, consultas de reputação (Google Safe Browsing, urlscan.io, OpenPhish, URLhaus, Internet Archive), buscas na web pelo domínio e visualização das páginas públicas informativas (`/`, `/modelos` e uma página de produto) por navegador automatizado, com captura de tela, HTML e arquivos estáticos.

**Não executado, por decisão de escopo:** preenchimento de formulários, digitação de CPF, abertura das rotas de checkout, geração de Pix, qualquer consulta ao backend Supabase (a chave pública presente no código não foi usada), varredura de portas, enumeração de caminhos além de `robots.txt`, `sitemap.xml` e dos arquivos listados pelo próprio manifesto do app, contorno de proteção anti-bot e pesquisa sobre pessoas físicas.

**Não executado, por bloqueio do ambiente:** a extração dos metadados de upload (nomes de arquivo e datas) embutidos no código do site foi barrada pelas regras de tratamento de dados pessoais do ambiente de execução. Os arquivos de código estão preservados íntegros no snapshot web e podem ser examinados por perito.

## 2. Snapshots gerados nesta coleta

Todos conferem com `./scripts/verify_evidence.sh`. O hash do manifesto `SHA256SUMS` identifica o snapshot inteiro.

| Diretório | Conteúdo | SHA-256 do `SHA256SUMS` |
| --- | --- | --- |
| `evidence/lojapayjoy.shop/20260929T152729Z` | Coleta passiva (DNS, RDAP, CT, `HEAD`). O RDAP do registro retornou `429`; o dado foi obtido na coleta OSINT. | `289c6adb64092e002e5d9fe45f3476abcea665a30fd6aa48fc4faae7fbd07101` |
| `evidence/lojapayjoy.shop-osint/20260929T153028Z` | 61 respostas de fontes de terceiros, com log e metadados (63 arquivos); nenhuma requisição ao domínio. | `6ab9d36de84d459b6b744d79ff9fcb1ff88b61865c0939b849698f0bb97d7052` |
| `evidence/lojapayjoy.shop-web/20260929T153617Z` | Primeira captura das páginas, **parcial**: o proxy de saída derrubou parte dos arquivos, e o CSS não carregou. Mantida por integridade; substituída pela seguinte. | `8eeb9d9ff286d6b0c626e5a76339d892b8372ff8af17e45a981e145d5289d0fa` |
| `evidence/lojapayjoy.shop-web/20260929T155023Z` | Captura completa: três páginas em desktop, página inicial em celular, 37 arquivos estáticos do manifesto do app. | `fa70673247f1e43e895130dded6cf3f2add523fc53e46323f77864ed173ef63b` |
| `evidence/lojapayjoy.shop-reputation/20260929T155256Z` | Página do Google Safe Browsing Transparency Report para o domínio. | `48a23a18910b83316b826e1e17407b53c62da6af504ca34c976cf0c49046ee4c` |
| `evidence/payjoy-official-reference/20260929T155629Z` | HTML servido por `loja.payjoy.com`, para comparação. | `a18594ec1a6dfae88b6ddf8773ef798975023700dc8e516d4d995eb88e0f73f1` |

## 3. Uso da marca PayJoy

| Achado | Fonte (snapshot web `20260929T155023Z`, salvo indicação) |
| --- | --- |
| Títulos das páginas: "PayJoy — Celular novo em parcelas fixas a cada 14 dias", "Todos os modelos de celular parcelado \| PayJoy", "Samsung Galaxy A26 5G 256GB — PayJoy". | `network-desktop-*.json`, campo `title` |
| Metadados declaram a marca: `author` = "PayJoy", `og:site_name` = "PayJoy"; dados estruturados JSON-LD de tipo `Organization` com `name` "PayJoy" e `url` `https://lojapayjoy.shop/`. `robots` = "index, follow". | `served-html-desktop-home.html` |
| Logotipo "PAYJOY" no cabeçalho e identidade visual verde. | `screenshot-desktop-home-viewport.png`, `asset-…-payjoy-logo-nohalo.png`, `asset-…-hero-payjoy-devices.png` |
| Rodapé "© 2026 Payjoy Brazil." e afirmações como "Mais de 20 milhões de pessoas já compraram seu celular parcelado com a PayJoy". | `visible-text-desktop-home.txt` |
| Links para `https://www.facebook.com/payjoy` e `https://www.instagram.com/payjoy`. | `network-desktop-home.json`, campo `links` |
| **Cópia de texto da loja oficial.** Ao menos quatorze frases da página inicial aparecem literalmente no HTML de `loja.payjoy.com`, entre elas "Seu celular novo está mais perto do que você imagina", "Entrada e parcelas fixas a cada 14 dias em até 9 meses", "Mais de 20 milhões de pessoas já compraram…", "Comece em casa, finalize na loja" e o rodapé "Gerenciar preferências de coleta de dados do site". | `visible-text-desktop-home.txt` comparado com `evidence/payjoy-official-reference/20260929T155629Z/loja.payjoy.com.html` |
| O nome do domínio junta "loja" e "payjoy", reproduzindo o nome de host da loja oficial `loja.payjoy.com`. | Observação sobre os nomes |

## 4. Oferta e público-alvo

Os trechos que **não** existem na página oficial são os que dirigem a oferta a pessoas com restrição de crédito e centralizam a coleta de CPF:

* "Aprovação imediata para negativados" e "A verificação usa apenas o seu CPF. A confirmação final acontece na etapa do cadastro." (`visible-text-desktop-home.txt`);
* "Você só precisa informar o seu CPF: a consulta é feita na hora, sem enviar documentos." (mesmo arquivo);
* três depoimentos atribuídos a "Hellen", "Pedro" e "Marcelo", com fotos servidas pelo próprio site (`asset-…-avatar-*.{png,jpg}`); a autenticidade não foi verificada;
* na página de produto: "Entrada estimada de R$165", "Valor a ser financiado R$1259", "*Sujeito à análise de crédito" e o selo de urgência "Só 3 em estoque" (`screenshot-desktop-produto_samsung-galaxy-a26-5g-256gb-viewport.png`).

O `sitemap.xml` lista 18 URLs: a página inicial, `/modelos` e 16 páginas de produto (`extra-sitemap.xml`).

## 5. Fluxo de pagamento (leitura do código estático)

Nenhuma dessas etapas foi executada; os achados vêm da leitura dos arquivos JavaScript preservados.

| Achado | Fonte |
| --- | --- |
| Rotas do app: `/checkout/$slug`, `/checkout/$slug/pagamento` e `/checkout/$slug/confirmacao`, além de `/`, `/modelos` e `/produto/$slug`. | `asset-28ca894d9271-index-CcG2BHMU.js` |
| A tela de pagamento exibe um campo Pix "Copia e cola" (`id` `pix-brcode`) e a instrução "Abra o app do seu banco, escaneie o QR Code ou use o código abaixo." O módulo também menciona WhatsApp; esse contexto não foi extraído. | `asset-2e546a22a099-checkout._slug.pagamento-0TbX-ufP.js` |
| Os dados do pagamento vêm de duas funções executadas **no servidor** (`POST`), com identificadores `85a7da13ce7fdaba6b1e1edac497a7cc5455cf15bdf57dbd1be6c4e29433c09d` e `26271183a9c63e54d57769c944c5ee6fabaad5c477c148b15792cb9ccd66f315`. Por isso o prestador de pagamento e o recebedor do Pix **não aparecem no código público**. | mesmo arquivo |
| O checkout consulta CEP na API pública `viacep.com.br`. | `asset-3c8b1e5091f9-checkout._slug.index-CzqUryUW.js` |
| O app usa o projeto Supabase `dvetcwjilckliooltfwg` (`https://dvetcwjilckliooltfwg.supabase.co`), com chave pública do tipo `sb_publishable_`. A chave não foi usada nem é reproduzida aqui. | `asset-28ca894d9271-index-CcG2BHMU.js` |
| Nas três páginas visitadas, o navegador não fez nenhuma chamada de API e não carregou rastreadores de terceiros; os únicos hosts externos foram `fonts.googleapis.com` e `fonts.gstatic.com`. O código contém referências a `gtag`, mas nenhuma requisição ao Google Analytics ocorreu nessas páginas. | `network-*.json` |

## 6. Infraestrutura

| Camada | Observação | Fonte |
| --- | --- | --- |
| Registro | Name.com, Inc. (IANA 625); titular protegido por "Domain Protection Services, Inc."; criação `2026-07-28T02:47:55Z`; expiração `2027-07-28T23:59:59Z`; status `client transfer prohibited`. | `…-osint/…/rdap-registrar.json`, `rdap-registry.json` |
| DNS | Servidores da Name.com (SOA `hostmaster.nsone.net`); `A` = `185.158.133.1` para o domínio e para `www`; sem `AAAA`, `MX`, `CAA`, `HTTPS`, DNSSEC; `_dmarc` inexistente (`NXDOMAIN`); TXT `_lovable` = `lovable_verify=096049e5…46ed`. Respostas idênticas nos resolvedores da Cloudflare e do Google. O serial do SOA (`1785206879`) corresponde numericamente a `2026-07-28T02:47:59Z`, quatro segundos depois do registro; isso é compatível com a criação da zona no registro, mas não o prova. | `…-osint/…/dns-*.json` |
| Plataforma | O DNS reverso do IP é `lovable-app-cd-1-4.p.l5e.io`. Os arquivos do site são servidos em `/__l5e/assets-v1/<uuid>/`, e o código cita `lovable.dev`. Junto com o registro `_lovable`, esses elementos indicam hospedagem na Lovable (inferência convergente, não declaração do provedor). | `…-osint/…/dns-cloudflare-ptr-185.158.133.1.json`; `served-html-desktop-home.html` |
| Identificador da implantação | O cabeçalho `x-deployment-id` tem prefixo estável `psr2.ace2fd78-4659-466d-8532-e48ac1fde1c3`; o sufixo muda a cada resposta, e seu número corresponde ao horário da resposta mais sete dias (±2 s nas duas coletas). | `evidence/lojapayjoy.shop/20260929T140811Z` e `…/20260929T152729Z`, `http-headers.txt` |
| Rede | O prefixo `185.158.133.0/24` é anunciado pelo AS13335 (Cloudflare, Inc.), visto por 325 de 325 pares do RIS; objetos `route` com origem AS13335 criados em 10/02/2025. O bloco está registrado no RIPE como `DET-FRA-CUSTOMERS`, organização `ORG-PC772-RIPE` ("Private Customer"), mantenedor `netutils-mnt`, geofeed em `ipxo.com`; o `/22` superior pertence a "Digital Energy Technologies Limited" (AS61317). Contato de abuso do bloco: `report@abuseradar.com`. | `…-osint/…/ripestat-*.json`, `rdap-ip-185.158.133.1.json`, `rdap-autnum-AS13335.json` |
| IP compartilhado | O Shodan InternetDB associa o mesmo IP a outros nomes sem relação com o caso. O IP, sozinho, não identifica o operador. | `…-osint/…/shodan-internetdb-185.158.133.1.json` |
| Cabeçalhos | Desta rede de coleta, o site responde `server: cloudflare`, com `cf-ray`, e sem `x-envoy-upstream-service-time`. Isso reforça que os cabeçalhos `envoy` do snapshot original vieram do proxy do ambiente Codex (limitação 2 do snapshot técnico). | `evidence/lojapayjoy.shop/20260929T152729Z/http-headers.txt` |
| Certificados | Quatro certificados da Google Trust Services (WE1 e WR1) para o domínio e para `www`, válidos até 26/10/2026; nenhum outro subdomínio aparece no CT. | `…-osint/…/ct-*.json`, `ct-cert-*.pem` |

## 7. Reputação e menções públicas

| Fonte | Resultado | Arquivo |
| --- | --- | --- |
| Google Safe Browsing | "Nenhum conteúdo não seguro foi encontrado"; "A última atualização destas informações foi em 10 de set. de 2026." O Chrome não alerta quem acessa o site. | `…-reputation/…/safebrowsing-report.png`, `.txt` |
| urlscan.io | Nenhuma análise pública do domínio. | `…-osint/…/urlscan-search-domain.json` |
| OpenPhish (feed público, 300 URLs na coleta) | Domínio ausente. | `…-osint/…/openphish-feed.txt` |
| URLhaus | Exige chave de API; não consultado. | `…-osint/…/urlhaus-host.json` |
| Internet Archive | A coleta preservada recebeu `429` e timeout. Uma consulta prévia, não preservada (≈15:29 UTC), indicou nenhuma captura arquivada. | `…-osint/…/wayback-*.json` |
| Busca na web (29/09/2026, ≈15:55 UTC) | Consultas "`"lojapayjoy.shop"`" e "`lojapayjoy golpe`": os únicos resultados relacionados foram este repositório (PRs #1 e #2 e a página principal). Nenhuma reclamação de vítima foi encontrada sob o nome do domínio. | Não preservado (resultado de buscador) |
| Nomes semelhantes | A busca por substring no crt.sh (`%payjoy%`, `%pay-joy%`) devolveu apenas nomes da própria PayJoy (`payjoy.com`, `payjoy.dev`) e **não** devolveu `lojapayjoy.shop`; logo, não é exaustiva. A busca curinga do urlscan.io exige conta. | `…-osint/…/ct-lookalike-*.json`, `urlscan-search-lookalike.json` |

## 8. Canais identificados para denúncia e preservação

A tabela lista destinatários e os indicadores que cada um consegue relacionar aos próprios registros. Não contém texto de denúncia.

| Destinatário | Canal e fonte | Indicadores relevantes |
| --- | --- | --- |
| Name.com (registrador) | `abuse@name.com` (RDAP do registrador e do registro). Os telefones de abuso diferem entre as duas fontes. | Domínio, identificador `DO18394215-GMO`, datas de registro e alteração |
| Lovable (plataforma) | Formulário `https://lovable.dev/abuse/report`; para marca, `https://lovable.dev/abuse/trademark` (página `https://lovable.dev/abuse`, acessada em 29/09/2026) | Domínio, token `lovable_verify`, prefixo do `x-deployment-id`, UUIDs em `/__l5e/assets-v1/`, DNS reverso |
| Supabase (backend) | `abuse@supabase.com`, indicado para "spam, phishing, malware, or unlawful activity" (`https://supabase.com/contact-us`, acessada em 29/09/2026) | Projeto `dvetcwjilckliooltfwg`; identificadores das funções de servidor |
| Cloudflare (AS13335) | Canal não verificado nesta sessão | IP, valores de `cf-ray` com horário |
| Titular do bloco IP | `report@abuseradar.com` (abuse-c no RIPE) | IP, prefixo |
| Google Safe Browsing | Formulário de denúncia de phishing; endereço não verificado nesta sessão | URL, capturas de tela |

O recebedor do Pix e o prestador de pagamento não são identificáveis por fonte pública: o QR Code é gerado no servidor. Eles aparecem no comprovante de uma vítima, ou podem ser obtidos por ordem judicial ou pedido de preservação dirigido à Lovable ou ao Supabase, referente às funções de servidor identificadas na seção 5.

## 9. Limitações desta coleta

1. Toda a coleta passou por um proxy de saída que intercepta TLS, registrado em cada `00_collection-info.txt`. Os certificados reais do site foram obtidos pelo CT, não pela conexão.
2. A saída de rede fica nos EUA (`cf-ray` com sufixo `IAD`). Um site fraudulento pode mostrar conteúdo diferente a visitantes do Brasil ou de redes móveis; isso não foi testado.
3. O navegador era um Chromium automatizado; no desktop, o agente de usuário contém "HeadlessChrome".
4. A análise do código foi manual e estática; funções ofuscadas podem ter passado despercebidas.
5. O snapshot web guarda imagens de pessoas usadas nos depoimentos (`asset-…-avatar-*`, `asset-…-cliente-moto-hd.png`). Elas devem ser tratadas como dados pessoais ao compartilhar o material.

## 10. Como repetir

```bash
./scripts/collect_lojapayjoy_public_evidence.sh
python3 scripts/collect_lojapayjoy_osint.py
NODE_PATH="$(npm root -g)" node scripts/capture_lojapayjoy_web.js
NODE_PATH="$(npm root -g)" node scripts/capture_safebrowsing_status.js
./scripts/verify_evidence.sh
python3 scripts/snapshot_indicators.py evidence/lojapayjoy.shop/<ANTERIOR> evidence/lojapayjoy.shop/<NOVO>
```

A referência oficial foi obtida com uma única requisição, registrada em `collection-log.tsv` do snapshot: `curl -sS --location --max-time 60 -o loja.payjoy.com.html https://loja.payjoy.com/`.

Os certificados vencem em 26/10/2026; uma renovação gera novas entradas no CT, que o comparador detecta.
