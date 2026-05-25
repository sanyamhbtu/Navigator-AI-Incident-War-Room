const { exec } = require('child_process');
const logger = require('../utils/logger');

/**
 * Run any SQL via Coral CLI and return parsed JSON rows.
 */
function runCoralQuery(sql) {
  return new Promise((resolve, reject) => {
    // Escape double quotes inside SQL for shell safety
    const escaped = sql.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const cmd = `coral sql "${escaped}" --output json`;

    logger.info(`[Coral] Running query: ${sql.slice(0, 80)}...`);

    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) {
        logger.error(`[Coral] CLI error: ${stderr || err.message}`);
        return reject(new Error(`Coral query failed: ${stderr || err.message}`));
      }
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (parseErr) {
        logger.error(`[Coral] JSON parse error: ${parseErr.message}`);
        reject(new Error(`Coral output parse failed: ${parseErr.message}`));
      }
    });
  });
}

/**
 * Run multiple queries in parallel.
 */
async function runCoralQueries(queries) {
  return Promise.all(queries.map(({ name, sql }) =>
    runCoralQuery(sql)
      .then(data => ({ name, data, ok: true }))
      .catch(err => ({ name, error: err.message, ok: false }))
  ));
}

module.exports = { runCoralQuery, runCoralQueries };