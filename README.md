# Quickish

Mysql-backed stock quote and holdings tracker.
(in progress)

# Install

```
npm i --save https://github.com/xpollen8/quickish
```

# Usage

```
const Quickish = require('quickish');

(async (config) => {
  const { run, done, fetchGoalsByDate, fetchValuesByDate } = new Quickish(config);
  await run();
  const { results, sums } = await fetchValuesByDate();
  console.log(results, sums);
  await done();
})({
  mysql: {
    database : 'stock',
  },
  quickish: {
    //account: 'Tradeking',
  },
});
```
