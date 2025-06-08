async function fetchData() {
  return new Promise((resolve) => {
    setTimeout(() => resolve([1, 2, 3, 4, 5]), 500);
  });
}

async function main() {
  const numbers = await fetchData();
  const total = numbers.reduce((a, b) => a + b, 0);
  console.log('Numbers:', numbers);
  console.log('Total:', total);
}

main();
