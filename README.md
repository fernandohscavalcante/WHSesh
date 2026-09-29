# WHSesh

Kit de preservação técnica, de escopo estritamente passivo, para o incidente de abuso de marca relacionado a `lojapayjoy.shop`.

* Para liderança e Jurídico: leia o [relatório executivo](docs/relatorio-executivo-lojapayjoy.md).
* Para Fraud Ops e analistas técnicos: leia o [snapshot técnico](docs/lojapayjoy-technical-status.md) e as regras de preservação de evidências.

O coletor é deliberadamente limitado a DNS público, RDAP (do domínio e dos endereços IP), Certificate Transparency e cabeçalhos HTTP. Ele não acessa a aplicação, checkout, APIs ou sistemas de terceiros.

| Script | Função |
| --- | --- |
| `scripts/collect_lojapayjoy_public_evidence.sh` | Nova coleta passiva, com registro de cada requisição e dos metadados do coletor. |
| `scripts/verify_evidence.sh` | Confere todos os snapshots contra seus manifestos `SHA256SUMS`, sem acesso à rede. |
| `scripts/snapshot_indicators.py` | Extrai os indicadores de um snapshot ou mostra o que mudou entre dois snapshots, sem acesso à rede. |
