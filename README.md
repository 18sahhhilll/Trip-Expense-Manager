# Trip Expense Manager 💰✈️

A polished, production-quality client-side **Trip Expense Manager** built for groups of friends. Track trip expenses on the fly, compute exact fair shares, calculate optimal settlement plans with minimal transactions, and export data directly to Excel or WhatsApp.

Fully client-side — **NO backend**, **NO database**, **NO login required**. All data persists in local browser storage.

---

## 🌟 Key Features

### 1. Trip Management
- Create, rename, delete, and switch between multiple trips.
- Manage participants (add, rename, delete with safety checks preventing deletion of participants involved in active expenses).
- Built-in **Sample Demo Data** loader for instant testing.

### 2. Expense Logging
- Fields: Description, Amount, Date & Time, Paid By, Category (*Food, Fuel, Toll, Parking, Stay, Other*).
- Filtering by person and category, search bar, and interactive sorting.
- Tappable rows for quick editing and deletion.

### 3. Flexible Split Engine
- **Equal – Everyone**: Even split across all trip members.
- **Equal – Selected**: Checkboxes to pick specific participants sharing a bill.
- **Group Split (Multi-Portion)**: Multi-group bill splitting (e.g. Veg group ₹2,400 / Non-veg group remainder ₹2,600) with live unassigned indicators.
- **Exact Amounts**: Enter specific rupee amounts per person.
- **Percentage (%)**: Enter percentage share per person.
- **Shares / Ratios**: Enter custom ratios (e.g., 2:1:1).
- **Paise-Safe Rounding**: Performs all internal math in integer paise with deterministic remainder distribution. Sum of shares ALWAYS equals bill total down to 0 paise.

### 4. Interactive Reference Views
- **Expense Log**: Complete itemized ledger with total row.
- **Balance Summary**: Displays per-person Paid, Share, and Net Status (*More / Less*).
- **Settlement Plan**: Optimal greedy algorithm to minimize total payments between members. Includes settlement checkboxes and WhatsApp text formatting.

### 5. Export & Backup Options
- **Excel Export (`.xlsx`)**: Generates 3 formatted sheets (*Expenses*, *Balances*, *Settlement*) using SheetJS.
- **WhatsApp Text Summary**: Copy formatted settlement plan directly for group chats.
- **JSON Backup / Restore**: Backup full data state to file and restore across devices.
- **PWA Offline Support**: Service worker and manifest for offline availability on phone browsers.

---

## 🛠 Tech Stack

- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Excel Export**: SheetJS (`xlsx`)
- **Testing**: Vitest

---

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/18sahhhilll/Trip-Expense-Manager.git

# Navigate to directory
cd Trip-Expense-Manager

# Install dependencies
npm install

# Start local dev server
npm run dev
```

### Running Tests

```bash
npx vitest run
```

### Production Build

```bash
npm run build
```

---

## 📄 License

MIT License. Free to use and modify!
