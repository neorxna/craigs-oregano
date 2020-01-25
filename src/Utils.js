const randomChoice = arr => {
  let index = Math.floor(Math.random() * arr.length)
  return arr[index]
}

const rand = (min, max) => Math.random() * (max - min + 1) + min

export { randomChoice, rand }
