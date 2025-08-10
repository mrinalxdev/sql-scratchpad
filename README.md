# SQL scratchpad

1. If you have and sqlite file then attach it in the `sqlite.ts` file or else if you want to see the demo
2. use `curl -L https://github.com/lerocha/chinook-database/raw/master/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite -o chinook.db` to download a demo db file

3. use `DB_PATH=./chinook.db bun run --watch src/index.ts` command to run and see the WEB UI in `localhost:3000`

For the docker part

```bash
# Build
docker build -t sql-scratchpad .

# Run with your database
docker run --rm -p 3000:3000 \
  -v "$PWD/chinook.db:/app/db.sqlite:ro" \
  -e ROOM_ID=team1 \
  sql-scratchpad
```

4. Try these commands to execute `sql 
SELECT a.Name AS Artist, al.Title AS Album, t.Name AS Track 
FROM Artist a 
JOIN Album al ON a.ArtistId = al.ArtistId 
JOIN Track t ON al.AlbumId = t.AlbumId 
LIMIT 10;`
