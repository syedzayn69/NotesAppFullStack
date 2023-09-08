import { useState, useEffect, useRef } from 'react'
import Note from './components/Note'
import Notification from './components/Notification'
import Footer from './components/Footer'
import noteServicesVar from './services/notes'
import loginServices from './services/login'
import LoginForm from './components/LoginForm'
import Togglable from './components/Toggleable'
import NoteForm from './components/NoteForm'

const App = () => {
  const [notes, setNotes] = useState([])
  const [showAll, setShowAll] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [loginVisible, setLoginVisible] = useState(false)

  const noteFormRef = useRef()
  
  const dataFetch = () => {
    noteServicesVar.getAll().then((returnedValue) => {
      setNotes(returnedValue)
    })
  }
  useEffect(dataFetch, [])
  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('UserDetails')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
      noteServicesVar.setToken(user.token)
    }
  }, [])

  const addNote = (noteObj) => {
    noteFormRef.current.toggleVisibility()
    noteServicesVar.create(noteObj).then((returnedValue) => {
      setNotes(notes.concat(returnedValue))
    })
    .catch(error => {
      if(error.response.data.error === 'Token Expired!'){
        setErrorMsg(error.response.data.error)
        setTimeout(() => setErrorMsg(null), 5000)
      }
    })
  }

  const toggleImportance = (id) => {
    if(!user){
      setErrorMsg(`Oops! This action can't be performed without logging in first!`)
      setTimeout(() => setErrorMsg(null), 3000)
      return
    }
    console.log(`importance of ${id} needs to be toggled`)
    const note = notes.find((elem) => elem.id === id)
    let changedNotes = { ...note, important: !note.important }
    
    noteServicesVar
      .update(id, changedNotes)
      .then((returnedValue) => {
        setNotes(notes.map((elem) => (elem.id !== id ? elem : returnedValue)))
      })
      .catch((error) => {
        if(error.response.data.error === 'Token Expired!'){
          setErrorMsg(error.response.data.error)
          setTimeout(() => setErrorMsg(null), 3000)
          return
        }
        setErrorMsg(`Note '${note.content}' was already removed from server`)
        setTimeout(() => setErrorMsg(null), 3000)
        setNotes(notes.filter((elem) => elem.id !== id))
      })
    }
    
    const deleteNoteFn = async (id) => {
      try{
        if(!user){
          setErrorMsg(`Oops! This action can't be performed without logging in first!`)
          setTimeout(() => setErrorMsg(null), 3000)
          return
        }

        if(window.confirm('Are you sure you want to remove this note?')){
          await noteServicesVar.deleteNote(id)
          dataFetch()
        }
        return
      }
      catch(error){
        console.log(error)
        if(error.response.data.error === 'Token Expired!'){
          setErrorMsg(error.response.data.error)
          setTimeout(() => setErrorMsg(null), 3000)
          return
        }
        setErrorMsg(`Note was already removed from server`)
        setTimeout(() => setErrorMsg(null), 5000)
        setNotes(notes.filter((elem) => elem.id !== id))
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    console.log(`logging in with ${username}, ${password}`)
    try {
      const user = await loginServices.login({ username, password })

      window.localStorage.setItem('UserDetails', JSON.stringify(user))
      noteServicesVar.setToken(user.token)
      setUser(user)
      setUsername('')
      setPassword('')
    } catch (exception) {
      setErrorMsg('Wrong Credentials!')
      setTimeout(() => {
        setErrorMsg(null)
      }, 5000)
    }
  }

  const handleUsernameChange = ({ target }) => {
    setUsername(target.value)
  }
  const handlePasswordChange = ({ target }) => {
    setPassword(target.value)
  }

  const loginForm = () => {
    const hideWhenVisible = { display: loginVisible ? 'none' : '' }
    const showWhenVisible = { display: loginVisible ? '' : 'none' }

    return (
      <div>
        <div style={hideWhenVisible}>
          <button onClick={() => setLoginVisible(true)}>Login</button>
        </div>
        <div style={showWhenVisible}>
          <LoginForm
            username={username}
            password={password}
            handleUsernameChange={handleUsernameChange}
            handlePasswordChange={handlePasswordChange}
            handleLogin={handleLogin}
          />
          <button onClick={() => setLoginVisible(false)}>Cancel</button>
        </div>
      </div>
    )
  }

  const logoutFn = () => {
    window.localStorage.removeItem('UserDetails')
    setUser(null)
  }

  const notesToShow = showAll
    ? notes
    : notes.filter((elem) => elem.important === true)
  return (
    <div>
      <h1>Notes</h1>
      <Notification message={errorMsg} />
      {!user && loginForm()}
      {user && (
        <div>
          <p>{user.name} logged in</p>
          <button onClick={logoutFn}>Log Out</button>
          <Togglable buttonLabel="new note" ref={noteFormRef} >
            <NoteForm createNote={addNote} />
          </Togglable>
        </div>
      )}
      <div>
        <button onClick={() => setShowAll(!showAll)}>
          show {showAll ? 'important' : 'all'}
        </button>
      </div>
      <ul>
        {notesToShow.map((note) => (
          <Note
            key={note.id}
            note={note}
            toggleImportance={() => toggleImportance(note.id)}
            deleteNote={() => deleteNoteFn(note.id)}
          />
        ))}
      </ul>
      <Footer />
    </div>
  )
}
export default App
