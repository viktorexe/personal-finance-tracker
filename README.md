# Personal Finance Tracker

A web-based personal finance tracker application built with Python (FastAPI), MongoDB, HTML, CSS, and JavaScript. This application allows users to track their income and expenses, view financial statistics, and manage their budget.

## Features

- User authentication (login/register)
- Transaction management (add, edit, delete)
- Income and expense tracking
- Financial statistics and charts
- Budget planning
- Category management
- Cross-device synchronization
- Responsive design

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Frontend**: HTML, CSS, JavaScript
- **Deployment**: Vercel (Serverless)

## Setup Instructions

### Prerequisites

- Python 3.8+
- MongoDB Atlas account (or local MongoDB instance)
- Vercel account (for deployment)

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/personal-finance-tracker.git
   cd personal-finance-tracker
   ```

2. Create a virtual environment and install dependencies:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```
   export MONGODB_URI="your_mongodb_connection_string"
   export SECRET_KEY="your_secret_key"
   ```

4. Run the application:
   ```
   uvicorn api.main:app --reload
   ```

5. Open your browser and navigate to `http://localhost:8000`

### Deployment to Vercel

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy the application:
   ```
   vercel
   ```

4. Set up environment variables in Vercel:
   - MONGODB_URI
   - SECRET_KEY

## MongoDB Setup

1. The application uses MongoDB Atlas with the following connection string:
   ```
   mongodb+srv://drviktorexe:Vansh240703@ttmod2025.9vmzbje.mongodb.net/?retryWrites=true&w=majority&appName=TTMod2025
   ```

2. The application creates a database named `personal_finance_tracker`

3. The application uses the following collections:
   - `users` - Stores user authentication information
   - For each user, a separate collection named `user_<username>` is created to store all user-specific data including:
     - Settings
     - Transactions
     - Budget information

4. This structure ensures excellent cross-device synchronization as all user data is stored in a single collection and synced every second.

## Project Structure

```
personal-finance-tracker/
├── api/
│   └── main.py
├── static/
│   ├── css/
│   │   ├── styles.css
│   │   └── dashboard.css
│   └── js/
│       ├── auth.js
│       └── dashboard.js
├── templates/
│   ├── index.html
│   └── dashboard.html
├── requirements.txt
├── vercel.json
└── README.md
```

## License

MIT

## Author

Your Name