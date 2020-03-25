const { Pool } = require('pg');

const dryRun = false;

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true'
  });
  const client = await pool.connect();

  try {
    const atBats = await client.query('select game_id, position, inning, result from at_bats');

    const update = 'update at_bats set result2 = $1 where game_id = $2 and position = $3 and inning = $4';
    await client.query('BEGIN');
    await client.query('ALTER TABLE at_bats ADD COLUMN result2 JSONB');
    for (const atBat of atBats.rows) {
      const { game_id: id, position, inning, result } = atBat;

      const match = result.match(/^([A-Za-z]+) *([0-9-]+)$/);

      const newResult = match ? { play: match[1], fielders: match[2] } : { play: result };

      if (dryRun) {
        console.log(`Updating id: ${id}, position: ${position}, inning: ${inning} with result: ${result} to ${JSON.stringify(newResult)}`);
      } else {
        await client.query(update, [newResult, id, position, inning]);
      }
    }

    await client.query('ALTER TABLE at_bats DROP COLUMN result');
    await client.query('ALTER TABLE at_bats RENAME COLUMN result2 TO result');
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
  }

  process.exit();
})();
