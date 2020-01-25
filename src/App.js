import React from 'react'
import './App.css'
import { useCraigsOregano } from './UseCraigsOregano'
import { OreganoPlant } from './Plant'
import { Cultivars } from './Cultivars'

function CraigsOregano (props) {
  const {
    oreganos,
    buyFerts,
    bumpHarvestedCount,
    clickOregano,
    totalHarvested,
    heirloomHarvested,
    totalPlants
  } = useCraigsOregano()

  return (
    <div className={'craigs-oregano'}>
      <div className={'oreganos'}>
        {oreganos
          .filter(o => !o.harvested)
          .map(plant => (
            <OreganoPlant
              {...plant}
              clickOregano={clickOregano}
              key={plant.id}
              bumpHarvestedCount={bumpHarvestedCount}
            />
          ))}
      </div>
      <div className={'info'}>
        <p className={'count'}>
          total oregano harvested: <b>{totalHarvested}</b>
          <br />
          heirloom varieties harvested: <b>{heirloomHarvested}</b>/
          {Object.values(Cultivars).length} <br />
          <b>{totalPlants}</b> plants growing <br />
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
