# WHSesh

Kit de preservação técnica, de escopo estritamente passivo, para o incidente de abuso de marca relacionado a `lojapayjoy.shop`.

* Para liderança e Jurídico: leia o [relatório executivo](docs/relatorio-executivo-lojapayjoy.md).
* Para Fraud Ops e analistas técnicos: leia o [snapshot técnico](docs/lojapayjoy-technical-status.md) e as regras de preservação de evidências.
* Para a coleta ampliada de 29/09/2026 (marca, pagamento, infraestrutura, canais de denúncia): leia o [registro OSINT](docs/registro-osint-lojapayjoy-20260929.md).

O coletor é deliberadamente limitado a DNS público, RDAP (do domínio e dos endereços IP), Certificate Transparency e cabeçalhos HTTP. Ele não acessa a aplicação, checkout, APIs ou sistemas de terceiros.

| Script | Função |
| --- | --- |
| `scripts/collect_lojapayjoy_public_evidence.sh` | Nova coleta passiva, com registro de cada requisição e dos metadados do coletor. |
| `scripts/collect_lojapayjoy_osint.py` | Coleta em fontes de terceiros (DNS, RDAP, RIPEstat, CT, reputação), sem requisição ao domínio. |
| `scripts/capture_lojapayjoy_web.js` | Captura das páginas públicas informativas como um visitante comum, sem interação. |
| `scripts/capture_safebrowsing_status.js` | Captura do Google Safe Browsing Transparency Report para o domínio. |
| `scripts/verify_evidence.sh` | Confere todos os snapshots contra seus manifestos `SHA256SUMS`, sem acesso à rede. |
| `scripts/snapshot_indicators.py` | Extrai os indicadores de um snapshot ou mostra o que mudou entre dois snapshots, sem acesso à rede. |
