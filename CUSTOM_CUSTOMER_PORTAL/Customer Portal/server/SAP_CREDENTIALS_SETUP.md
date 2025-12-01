# How to Set SAP Username and Password

## Step 1: Create `.env` file

In the `server/` directory, create a file named `.env` (copy from `env.example`):

**Windows:**
```bash
cd server
copy env.example .env
```

**Linux/Mac:**
```bash
cd server
cp env.example .env
```

## Step 2: Encode Your Credentials

The `SAP_BASIC` variable requires Base64 encoded `username:password` format.

### Windows PowerShell:

1. Open PowerShell
2. Run this command (replace `username` and `password` with your actual SAP credentials):

```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("username:password"))
```

**Example:**
```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("SAPUSER:MyPassword123"))
```

This will output something like: `U0FQUVVTRVI6TXlQYXNzd29yZDEyMw==`

### Linux/Mac Terminal:

```bash
echo -n "username:password" | base64
```

**Example:**
```bash
echo -n "SAPUSER:MyPassword123" | base64
```

## Step 3: Edit `.env` File

Open the `.env` file in the `server/` directory and update these values:

```env
# SAP Configuration
SAP_BASE_URL=http://172.17.19.24:8000
SAP_CLIENT=100

# Replace the example value with your Base64 encoded credentials
SAP_BASIC=U0FQUVVTRVI6TXlQYXNzd29yZDEyMw==

# Server Configuration
PORT=4000
CLIENT_ORIGIN=http://localhost:4200

# Caching Configuration
USE_CACHE=true
CACHE_TTL_MS=300000

# SAP Endpoint Configuration
SAP_SINGLE_ENDPOINT=false
```

## Important Notes

⚠️ **Security:**
- Never commit the `.env` file to git (it's already in `.gitignore`)
- Never share your `.env` file or credentials
- The `.env` file should only exist on your local machine/server

## Quick Test

After setting up `.env`, start the server:

```bash
cd server
npm run dev
```

You should see:
```
🚀 Kaar Customer Portal Server running on port 4000
📡 SAP Base URL: http://172.17.19.24:8000
🌐 CORS enabled for: http://localhost:4200
💾 Cache: ENABLED
```

If you see "NOT CONFIGURED" for SAP Base URL, check that your `.env` file is in the `server/` directory.

## Troubleshooting

**"SAP_BASE_URL and SAP_BASIC must be configured" error:**
- Make sure `.env` file exists in `server/` directory
- Check that variable names match exactly (no spaces, correct spelling)
- Restart the server after editing `.env`

**Authentication errors:**
- Verify your username and password are correct
- Check that Base64 encoding was done correctly
- Ensure the format is `username:password` (with colon, no spaces)

