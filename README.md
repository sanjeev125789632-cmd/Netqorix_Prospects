# Netqorix Prospects

React/Vite sales prospect workspace. The generated site includes 2,206 business leads in ten region groups. Sales notes, statuses and follow-up dates are stored in the current browser's localStorage; use the JSON backup in the app before clearing browser data.

## Data sources

The original 1,222 records are generated from `Netqorix_All_Prospects_1222.csv` into four `src/data/prospects*.ts` files. Their `lead-1` through `lead-1222` IDs are retained so existing browser notes remain attached. The separate 20 September website research CSV applies only to selected original records.

The 984 additional records are generated into `src/data/prospectsAdditional.ts` from:

| Workbook | Records | Collected |
| --- | ---: | --- |
| Netqorix_Bankura_Durgapur_Prospects.xlsx | 300 | 23 Sep 2026 |
| Netqorix_JammuKashmir_Prospects.xlsx | 301 | 23 Sep 2026 |
| Netqorix_NorthEast_Prospects_1.xlsx | 300 | 21 Sep 2026 |
| Netqorix_International_Round5.xlsx | 20 | 13 Sep 2026 |
| Netqorix_Round6_National_and_International.xlsx | 63 | 18 Sep 2026 |

The four corresponding Chandigarh, Hyderabad, Mira Road and Delhi workbooks match the existing records by rank and business name. `Call First`, national and international sheets in the workbooks are views of their main leads, not separate records. Round 6 is split into 36 national and 27 international leads in the app.

To regenerate the additional source file, install `openpyxl` in a Python environment and run:

```bash
python scripts/import-prospect-workbooks.py /path/to/xlsx-files
npm run build
```

The source files report that each new lead's Google Maps card lacked a website button on the collection date. The app labels this as a source observation, separate from the earlier independent website research. A Maps search link is not a saved place ID, so verify the branch, phone and current website before outreach. The workbook's list price and deal value are estimates, not accepted quotes.

## Access and deployment

`npm run dev` starts the local app. `npm run build` produces `dist/` for static hosting.

This repository is public and includes prospect phone numbers in the client bundle. The passcode is implemented in browser code and does **not** protect the data from access. Private prospect hosting requires server-side authentication and a non-public data store.
