# CRM DEMO   

This is a demo project of an CRM system.

* To deploy the project you need:
    * install Node.js, then go to the the server folder (project_root/server) run the command: npm install. all project dependencies will install automatically
    * then you have to restore a database. Install the last version of PostgreSQL server and restore the dump file using a special utility "pg_restore" (supplied with the PostgreSQL server)
        * Dump file is here: /database_dump
        * The connection parameters are already signed in the config file (/server/config)

* To access the user interface start the server and go to the main page: localhost:8080/
