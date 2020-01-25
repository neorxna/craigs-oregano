import React, { useState, useEffect } from 'react'
import { usePoissonProcess } from './UsePoissonProcess'
import * as PoissonSampling from 'poisson-disk-sampling'

function OreganoPlant (props) {
  const {
    id,
    x,
    y,
    heirloom,
    cultivar,
    clickOregano,
    baseGrowthRate,
    bumpHarvestedCount,
    leafClusterFactor,
    jitterX,
    jitterY,
    color,
    size
  } = props

  const maxLeaves = size

  const [oreganoLeaves, updateOreganoLeaves] = useState([])
  const [sampler, setSampler] = useState(() => {
    return new PoissonSampling([size, size], size / leafClusterFactor)
  })

  const [growthRate, updateGrowthRate] = useState(baseGrowthRate)

  const clickLeaf = leafId => {
    updateOreganoLeaves(os =>
      os.map(o => (o.id === leafId ? { ...o, harvested: true } : o))
    )
    bumpHarvestedCount(id)
    // reset the growth rate to the base growth rate.
    updateGrowthRate(() => baseGrowthRate)
  }

  useEffect(
    () => {
      // update the sampler whenever the number of harvested leaves changes
      // to reflect the loss of the leaf.
      setSampler(() => {
        const sampler = new PoissonSampling([size, size], size / 4)
        oreganoLeaves
          .filter(o => !o.harvested)
          .forEach(o => {
            sampler.addPoint([o.x, o.y])
          })
        return sampler
      })
    },
    [oreganoLeaves.filter(o => o.harvested).length]
  )

  useEffect(
    () => {
      // whenever the number of leaves changes, increase the growth rate.
      updateGrowthRate(rate => {
        return rate / baseGrowthRate + baseGrowthRate / 2
      })
    },
    [oreganoLeaves.length]
  )

  usePoissonProcess(() => {
    updateOreganoLeaves(os => {
      const numPoints = sampler.getAllPoints().length
      const noLeaves = numPoints === 0

      if (os.filter(o => !o.harvested).length >= maxLeaves) {
        return os
      }

      const sample = noLeaves
        ? sampler.addPoint([size / 2, size / 2])
        : sampler.next()

      if (sample !== null) {
        let growthLimitReached =
          Math.pow(Math.abs(sample[0]), 2) + Math.pow(Math.abs(sample[1]), 2) >
          Math.pow(size, 2)

        let leaf = {
          x: Math.round(sample[0] + jitterX),
          y: Math.round(sample[1] + jitterY),
          id: Math.random(),
          heirloom
        }
        return growthLimitReached ? os : [...os, leaf]
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
            style={{
              left: -(size / 2) + leaf.x,
              top: -(size / 2) + leaf.y,
              backgroundColor: color
            }}
            title={
              'Origanum ' + cultivar + (heirloom ? ' (heirloom variety)' : '')
            }
            onClick={e => {
              e.preventDefault()
              if (oreganoLeaves.filter(o => !o.harvested).length === 1) {
                clickOregano(id)
              } else {
                clickLeaf(leaf.id)
              }
            }}
            key={leaf.id}
          />
        ))}
    </div>
  )
}

export { OreganoPlant }
