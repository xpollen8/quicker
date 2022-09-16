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
  const { start, finish, fetchGoalsByDate, fetchValuesByDate } = new Quicker(config);
  await start();
  const { results, sums } = await fetchValuesByDate();
  console.log(results, sums);
  await finish();
})({
  mysql: {
    database : 'stock',
  },
  quicker: {
    //account: 'Tradeking',
  },
});
```
