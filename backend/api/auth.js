const router = require('express').Router()
const { hashPassword, verifyPassword } = require('./bcrypt')

let id = 0
const getId = () => ++id

let users = []

router.post('/api/auth/register', async (req, res, next) => {
  // check username for uniqueness, hash password and write user to db
  const {username, password: plainPassword} = req.body
  const user = users.find(u => u.username == username)
  if (!user){
    const hash = hashPassword(plainPassword)
    const newUser = {id: getId(), username, password: hash}
    users.push(newUser)
    res.json({message: `Welcome ${username}`})

  }else{
    next({status: 409, message: "user taken"})
  }

})

router.post('/api/auth/login', async (req, res, next) => {
  // check username exists and password matches the hash in the db
  const { username, password: plainPassword } = req.body
  const user = users.find(u => u.username == username)
  if (user && (await verifyPassword(plainPassword, user.password))) {
    req.session.user = user
    res.json({message: "good to see you again"})
``
  } else {
  next({ status: 401, message: 'Invalid credentials' })
  }
})

router.post('/api/auth/logout', (req, res, next) => {
  req.session.destroy(err => {
    res.json()
  })
  next({ message: 'Logout failed' })
})

module.exports = router
