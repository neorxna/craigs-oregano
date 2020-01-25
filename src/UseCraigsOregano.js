import React, { useState, useEffect } from 'react'
import * as PoissonSampling from 'poisson-disk-sampling'
import { usePoissonProcess } from './UsePoissonProcess'
import { rand, randomChoice } from './Utils'
import { Cultivars } from './Cultivars'
import * as Color from 'color2'

const WIDTH = window.innerWidth - window.innerWidth/4
const HEIGHT = window.innerHeight - window.innerHeight/4
const XOFFSET = 100
const YOFFSET = 100
const averageInterval = 1000
const jitterX = 0
const jitterY = 0
const initialClusteringFactor = 12 // per width

function useCraigsOregano () {
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
      sampler.getAllPoints().length === 0
        ? sampler.addPoint([WIDTH / 2, HEIGHT / 2])
        : sampler.next()

    // work out if the oregano is near an heirloom
    const heirloom = randomChoice([true, false, false, false, false])
    const size = rand(10, 100)
    const cultivar = randomChoice([
      ...Object.values(Cultivars),
      Cultivars.Vulgare,
      Cultivars.Vulgare,
      Cultivars.Vulgare
    ])
    const color =
      cultivar === Cultivars.Vulgare
        ? '#167a40'
        : new Color('#167a40').lighten(rand(0, 0.4)).saturate(rand(0.2, 0.8))

    return sample
      ? [
        ...os,
        {
          x: XOFFSET + Math.round(sample[0]) + rand(0, jitterX),
          y: YOFFSET + Math.round(sample[1]) + rand(0, jitterY),
          id: Math.random(),
          heirloom,
          cultivar,
          jitterX,
          jitterY,
          baseGrowthRate: averageInterval * rand(0.2, 2),
          harvestedLeaves: 0,
          leafClusterFactor: size / 2,
          size,
          color,
          harvested: false,
          ...properties
        }
      ]
      : os
  }

  usePoissonProcess(() => {
    setOreganos(os => updateOreganos(os, poissonSampler))
  }, averageInterval)

  const refreshSampler = () => {
    setPoissonSampler(() => {
      // updating the clustering factor requires creating a new sampler instance
      const newSampler = new PoissonSampling(
        [WIDTH, HEIGHT],
        WIDTH / clusteringFactor
      )

      // Add existing oregano positions to the newly created poissonSampler instance.
      oreganos
        .filter(o => !o.harvested) // ignore already harvested. allows for new growth.
        .forEach(({ x, y }) => {
          newSampler.addPoint([x, y])
        })

      return newSampler
    })
  }
  useEffect(refreshSampler, [clusteringFactor])
  useEffect(refreshSampler, [oreganos.filter(o => o.harvested).length])

  const heirlooms = oreganos.filter(o => o.heirloom && o.harvestedLeaves > 0)
  const leafCount = (acc, plant) => acc + plant.harvestedLeaves

  // add the harvested leaves and the harvested plants themselves
  const totalHarvested =
    oreganos.reduce(leafCount, 0) + oreganos.filter(o => o.harvested).length

  const heirloomHarvested = new Set(heirlooms.map(h => h.cultivar)).size

  const totalPlants = oreganos.filter(o => !o.harvested).length

  return {
    oreganos,
    buyFerts,
    bumpHarvestedCount,
    clickOregano,
    totalHarvested,
    heirloomHarvested,
    totalPlants
  }
}

export { useCraigsOregano }
