const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'covid19India.db')
const app = express()
app.use(express.json())

let db = null

const initDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('The Server is running at http://localhost:3000/'),
    )
  } catch (err) {
    console.log(`DB Error ${err.message}`)
    process.exit(1)
  }
}
initDbAndServer()

const convertStateToRespObj = dbObj => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  }
}
const convertDistrictToRespObj = dbObj => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  }
}

//GET states
app.get('/states/', async (request, response) => {
  const getStates = `SELECT * FROM state ORDER BY state_id;`
  const states = await db.all(getStates)
  response.send(states.map(each => convertStateToRespObj(each)))
})

//GET state on ID
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getState = `SELECT * FROM state WHERE state_id=${stateId};`
  const state = await db.get(getState)
  response.send(convertStateToRespObj(state))
})

//POST district
app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postDistrict = `INSERT INTO district 
    (district_name, state_id, cases, cured, active, deaths)
    VALUES('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`
  await db.run(postDistrict)
  response.send('District Successfully Added')
})

//GET district on ID
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrict = `SELECT * FROM district WHERE district_id=${districtId};`
  const district = await db.get(getDistrict)
  response.send(convertDistrictToRespObj(district))
})

//DELETE district
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrict = `DELETE FROM district WHERE district_id=${districtId};`
  await db.run(deleteDistrict)
  response.send('District Removed')
})

//PUT district
app.put('/districts/:districtId/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const {districtId} = request.params
  const putDistrict = `UPDATE district 
  SET district_name= '${districtName}',
  state_id= ${stateId},
  cases= ${cases}, cured= ${cured},
  active= ${active}, deaths= ${deaths} WHERE district_id=${districtId};`
  await db.run(putDistrict)
  response.send('District Details Updated')
})

//GET stats from district
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStats = `SELECT SUM(cases) as totalCases,
  SUM(cured) as totalCured, SUM(active) as totalActive,
  SUM(deaths) as totalDeaths FROM district WHERE state_id=${stateId};`
  const stats = await db.get(getStats)
  response.send(stats)
})

//GET statename of district based in Id
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrict = `SELECT state_id FROM district WHERE district_id=${districtId};`
  const getDistrictRes = await db.get(getDistrict)

  const getState = `SELECT state_name as stateName FROM state 
  WHERE state_id=${getDistrictRes.state_id};`
  const getStateNameOfDistrict = await db.get(getState)
  response.send(getStateNameOfDistrict)
})

module.exports = app
