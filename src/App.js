import React, { useState, useEffect, useRef } from 'react'
import * as PoissonSampling from 'poisson-disk-sampling'
import { sample } from 'poisson-process'

import './App.css'

const WIDTH = 800
const HEIGHT = 600
const averageInterval = 3000
const jitter = 0
const initialClusteringFactor = 4 // per width
const leafClusterMultiplier = 20

const randomChoice = arr => {
  let index = Math.floor(Math.random() * arr.length)
  return arr[index]
}

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

/* https://overreacted.io/making-setinterval-declarative-with-react-hooks/ */
function useInterval (callback, delay) {
  const savedCallback = useRef()
  useEffect(
    () => {
      savedCallback.current = callback
    },
    [callback]
  )
  useEffect(
    () => {
      function tick () {
        savedCallback.current()
      }
      if (delay !== null) {
        let id = setInterval(tick, delay)
        return () => clearInterval(id)
      }
    },
    [delay]
  )
}

function usePoissonProcess (cb, rate) {
  useInterval(cb, sample(rate))
}

function OreganoPlant (props) {
  const {
    id,
    x,
    y,
    heirloom,
    clickOregano,
    growthRate,
    bumpHarvestedCount
  } = props
  const size = 500

  const [oreganoLeaves, updateOreganoLeaves] = useState([])
  const [sampler, setSampler] = useState(() => {
    return new PoissonSampling(
      [size, size],
      size / (initialClusteringFactor * leafClusterMultiplier)
    )
  })

  const clickLeaf = leafId => {
    updateOreganoLeaves(os =>
      os.map(o => (o.id === leafId ? { ...o, harvested: true } : o))
    )
    bumpHarvestedCount(id)
  }

  usePoissonProcess(() => {
    updateOreganoLeaves(os => {
      const noLeaves = sampler.getAllPoints().length === 0
      const sample = noLeaves
        ? sampler.addPoint([size / 2, size / 2])
        : sampler.next()

      if (sample !== null) {
        let growthLimitReached =
          os.length > 0 &&
          os.filter(o => {
            return (
              !o.harvested &&
              Math.sqrt(
                Math.pow(Math.abs(sample[0]), 2) +
                  Math.pow(Math.abs(sample[1]), 2)
              ) < size
            )
          }).length === 0 // find length of array which contains oreganos nearby

        let leaf = {
          x: Math.round(sample[0]) + rand(0, jitter),
          y: Math.round(sample[1]) + rand(0, jitter),
          id: Math.random(),
          heirloom
        }
        return !growthLimitReached ? [...os, leaf] : os
      } else {
        return os
      }
    })
  }, growthRate)

  return (
    <div
      className={'oregano' + (heirloom ? ' oregano--heirloom' : '')}
      style={{ left: x, top: y }}
      aria-label={'oregano'}
    >
      {oreganoLeaves
        .filter(o => !o.harvested)
        .map(leaf => (
          <div
            className={
              'oregano-leaf' + (leaf.heirloom ? ' oregano--heirloom' : '')
            }
            style={{ left: -(size / 2) + leaf.x, top: -(size / 2) + leaf.y }}
            onClick={e => {
              e.preventDefault()
              if (oreganoLeaves.length === 1) {
                clickOregano(id)
              } else {
                clickLeaf(leaf.id)
              }
            }}
            averageInterval
            key={leaf.id}
          />
        ))}
    </div>
  )
}

function CraigsOregano (props) {
  const [oreganos, setOreganos] = useState([])
  const [clusteringFactor, setClusteringFactor] = useState(
    initialClusteringFactor
  )

  const buyFerts = () => {
    setClusteringFactor(f => f + 1)
  }

  const bumpHarvestedCount = id => {
    setOreganos(os =>
      os.map(o =>
        o.id === id ? { ...o, harvestedLeaves: o.harvestedLeaves + 1 } : o
      )
    )
  }

  const clickOregano = id => {
    setOreganos(os =>
      os.map(o => (o.id === id ? { ...o, harvested: true } : o))
    )
  }

  const [poissonSampler, setPoissonSampler] = useState(() => {
    return new PoissonSampling([WIDTH, HEIGHT], WIDTH / clusteringFactor)
  })

  const updateOreganos = (os, sampler, properties) => {
    const sample =
      sampler.getAllPoints().length === 0 && !properties.lil
        ? sampler.addPoint([WIDTH / 2, HEIGHT / 2])
        : sampler.next()

    // work out if the oregano is near an heirloom
    const heirloom = randomChoice([true, false, false, false, false])

    return sample
      ? [
        ...os,
        {
          x: Math.round(sample[0]) + rand(0, jitter),
          y: Math.round(sample[1]) + rand(0, jitter),
          id: Math.random(),
          heirloom,
          growthRate: averageInterval + averageInterval * rand(0.01, 0.6),
          harvestedLeaves: 0,
          ...properties
        }
      ]
      : os
  }

  usePoissonProcess(() => {
    setOreganos(os => updateOreganos(os, poissonSampler, { lil: false }))
  }, averageInterval)

  useEffect(
    () => {
      setPoissonSampler(() => {
        // updating the clustering factor requires creating a new sampler instance
        const newSampler = new PoissonSampling(
          [WIDTH, HEIGHT],
          WIDTH / clusteringFactor
        )

        // Add existing oregano positions to the newly created poissonSampler instance.
        oreganos
          .filter(o => !o.lil && !o.harvested) // ignore already harvested. allows for new growth.
          .forEach(({ x, y }) => {
            newSampler.addPoint([x, y])
          })

        return newSampler
      })
    },
    [clusteringFactor]
  )

  const totalHarvested = oreganos.reduce(
    (acc, plant) => acc + plant.harvestedLeaves,
    0
  )
  const heirloomHarvested = oreganos
    .filter(o => o.heirloom)
    .reduce((acc, plant) => acc + plant.harvestedLeaves, 0)
  const totalPlants = oreganos.filter(o => !o.harvested && !o.lil).length
  return (
    <div className={'craigs-oregano'}>
      <div className={'oreganos'}>
        {oreganos
          .filter(o => !o.harvested)
          .map(({ id, x, y, heirloom, growthRate }) => (
            <OreganoPlant
              x={x}
              y={y}
              id={id}
              heirloom={heirloom}
              clickOregano={clickOregano}
              growthRate={growthRate}
              key={id}
              bumpHarvestedCount={bumpHarvestedCount}
            />
          ))}
      </div>
      <div className={'info'}>
        <p className={'count'}>
          total oregano harvested: <b>{totalHarvested}</b>
          <br />
          heirloom varieties harvested: <b>{heirloomHarvested}</b> <br />
          plants: <b>{totalPlants}</b> <br />
        </p>
        <p>
          <a
            href='#'
            onClick={e => {
              e.preventDefault()
              buyFerts()
            }}
            aria-label='apply fertiliser'
          >
            apply fertiliser
          </a>
          <br />
          <code>{JSON.stringify(clusteringFactor)}</code>
        </p>
      </div>
    </div>
  )
}

function App () {
  return (
    <div className='App'>
      <CraigsOregano />
    </div>
  )
}

export default App
