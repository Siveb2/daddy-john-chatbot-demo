# Local PostgreSQL Setup for Windows

## Option 1: Using PostgreSQL Installer
1. Download from https://www.postgresql.org/download/windows/
2. Run installer and follow setup wizard
3. Remember the password you set for 'postgres' user
4. Your connection string will be:
   ```
   postgresql://postgres:your_password@localhost:5432/chatbot_db
   ```

## Option 2: Using Docker (if you have Docker)
```bash
docker run --name postgres-chatbot -e POSTGRES_PASSWORD=mypassword -e POSTGRES_DB=chatbot_db -p 5432:5432 -d postgres:15
```
Connection string: `postgresql://postgres:mypassword@localhost:5432/chatbot_db`

## Creating the Database
After installing PostgreSQL locally:
1. Open pgAdmin (comes with PostgreSQL)
2. Connect to your server
3. Right-click "Databases" → Create → Database
4. Name it "chatbot_db"