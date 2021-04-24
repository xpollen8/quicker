# Quicker

Mysql-backed stock quote and holdings tracker.
(in progress)

# Install

```
npm i --save https://github.com/xpollen8/quicker
```

# Usage

```
const Quicker = require('quicker');

(async (config) => {
  const { run, done, fetchGoalsByDate, fetchValuesByDate } = new Quicker(config);
  await run();
  const { results, sums } = await fetchValuesByDate();
  console.log(results, sums);
  await done();
})({
  mysql: {
    database : 'stock',
  },
  quicker: {
    //account: 'Tradeking',
  },
});
```
