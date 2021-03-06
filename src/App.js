import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Redirect, Link, Switch} from 'react-router-dom'
import logo from './logo.svg';
import './App.css';
import SignUpForm from './components/users/SignUpForm'
import LoginForm from './components/users/LoginForm'
import NavBar from './components/NavBar'
import HomeContainer from './components/HomeContainer'
import AdContainer from './components/ads/AdContainer'
import AdForm from './components/ads/AdForm'
import AdDetailsContainer from './components/ads/AdDetailsContainer'
import UsersContainer from './components/users/UsersContainer'
import UserProfileContainer from './components/users/userProfile/UserProfileContainer'
import Auth from './auth'
import AuthAdapter from './authAdapter'
import UserCard from './components/users/UserCard'
import UserProfContainer from './components/users/UserProfContainer'

class App extends Component {
  constructor() {
    super()

    this.state = {
      auth: {
        currentUser: {},
      },
      ads: [],
      savedAds: [],
      users: [],
      currentAds: [],
      saverAds: [],
      selectedAd: {},
      selectedUser: {},
      categories: [],
      newAd: {}
    }
  }

  isLoggedIn = () => !!window.localStorage.email

  componentDidMount(){
    if (localStorage.getItem('email')) {
      // console.log("hello")
       let email = localStorage.getItem('email')
       fetch('http://localhost:3000/api/v1/users')
       .then(data => data.json())
       .then(users => users.filter(user => user.email === email)[0])
       .then(currentUser => this.setState({
         auth: {
           currentUser: currentUser
         },
        //  savedAdIds: currentUser.saved_ads.map(saved_ad => saved_ad.id),
         savedAds: currentUser.saved_ads
       })
     )
     }

   fetch('http://localhost:3000/api/v1/users')
   .then(data => data.json())
   .then(users => this.setState({users}))


   fetch('http://localhost:3000/api/v1/saver_ads')
   .then(data => data.json())
   .then(saverAds => this.setState({saverAds}))

  fetch('http://localhost:3000/api/v1/ads')
  .then(data => data.json())
  .then(ads => this.setState({
    ads,
    currentAds: ads
  }))

  fetch('http://localhost:3000/api/v1/categories')
  .then(data => data.json())
  .then(categories => this.setState({ categories }))
  }


  onLogin(loginParams){
    AuthAdapter.login(loginParams)
      .then( res => {
        //check for an error message
        if( res.error ){
          console.log("do nothing")
        } else {
          // debugger
          localStorage.setItem('email', res.user.email)
          this.setState({
            auth:{
              currentUser: res.user
            }
          })
        }
        //if error render login again
        //else set the jwt token and forward user to /giphs
      })
  }

  handleLogout = () => {
      localStorage.clear()
      this.setState({
        auth: {
          currentUser: {}
      }})
    }

  handleSearch = (searchTerm) => {
    let searchResults = this.state.ads.filter( ad => {
      return ad.title.toLowerCase().includes(searchTerm.toLowerCase()) || ad.description.toLowerCase().includes(searchTerm.toLowerCase()) || ad.categories[0].name.toLowerCase().includes(searchTerm.toLowerCase())
    })
    this.setState({
      currentAds: searchResults
    })
  }

  handleSaveAd = (adId) => {
    console.log("saving")
    fetch('http://localhost:3000/api/v1/saver_ads', {
      method: 'POST',
      body: JSON.stringify({ "saver_id": `${this.state.auth.currentUser.id}`, "saved_ad_id": `${adId}` }),
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json',
      }
    })
    .then(res => res.json())
    .then(res => console.log(res))
    .then(() => this.reFetchSaverAds())
  }

  handleUnsaveAd = (adId) => {
    console.log("unsaving")
    let saverAd = this.state.saverAds.filter((saverAd) => saverAd.saver_id === this.state.auth.currentUser.id && saverAd.saved_ad_id === adId)[0]
    let saverAdId = saverAd.id
    fetch(`http://localhost:3000/api/v1/saver_ads/${saverAdId}`, {
      method: 'DELETE',
      body: {id: `${saverAdId}`},
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json',
        // 'Authorization': localStorage.getItem('jwt')
      }
    })
    .then(res => res.json())
    .then(() => this.reFetchSaverAds())
  }

  reFetchSaverAds = () => {
    fetch('http://localhost:3000/api/v1/saver_ads')
    .then(data => data.json())
    .then(saverAds => this.setState({saverAds}))
  }

  handleInfoSelect = (ad) => {
      this.setState({
        selectedAd: ad
      })
  }

  handleUserSelect = (user) => {
      this.setState({
        selectedUser: user
      })
  }

  setCurrentUser = (user) => {
    this.setState({currentUser: user})
    localStorage.setItem('email', user.email)
  }

  handlePost = () => {
    fetch('http://localhost:3000/api/v1/ads')
    .then(data => data.json())
    .then(ads => this.setState({
      ads,
      currentAds: ads
    }))
  }

  render() {
    console.log("saver ads", this.state.saverAds)
    return (
      <Router>
        <div>
          <Route path='/' render={()=> <NavBar isLoggedIn={this.isLoggedIn} user={this.state.auth.currentUser} handleLogout={this.handleLogout} /> } />

          <Route path='/login' render={()=> this.isLoggedIn() ? <Redirect to="/ads"/> : <LoginForm onLogin={this.onLogin.bind(this)}/> } />

          <Route path="/signup" render={()=> <SignUpForm setCurrentUser={this.setCurrentUser}/>} />

          <Route exact path="/" render={()=> !this.isLoggedIn() ? <Redirect to="/login"/> : <Redirect to="/ads" /> } />

          <Route exact path="/ads" render={()=> !this.isLoggedIn() ? <Redirect to="/login"/> : <AdContainer ads={this.state.currentAds} savedAds={this.state.savedAds} handleSearch={this.handleSearch} handleInfoSelect={this.handleInfoSelect} handleUserSelect={this.handleUserSelect} handleSaveAd={this.handleSaveAd} handleUnsaveAd={this.handleUnsaveAd}/> } />

          <Switch>

            <Route path="/ads/new" render={()=> !this.isLoggedIn() ? <Redirect to="/login"/> :<AdForm currentUser={this.state.auth.currentUser} categories={this.state.categories} handlePost={this.handlePost}/> } />

            <Route exact path="/ads/:id" render={()=> !this.isLoggedIn() ? <Redirect to="/login"/> : <AdDetailsContainer selectedAd={this.state.selectedAd} /> } />

          <Route exact path="/users" render={()=> !this.isLoggedIn() ? <Redirect to="/login"/> : <UsersContainer handleInfoSelect={this.handleInfoSelect} handleUserSelect={this.handleUserSelect} users={this.state.users} /> }/>

          <Route path="/users/profile" render={()=> !this.isLoggedIn() ? <Redirect to="/login"/> : <UserProfileContainer currentUser={this.state.auth.currentUser} ads={this.state.ads} handleInfoSelect={this.handleInfoSelect}/>}/>

          <Route exact path="/users/:id" render={()=> !this.isLoggedIn() ? <Redirect to="/login"/> : <UserProfContainer user={this.state.selectedUser} handleUserSelect={this.handleUserSelect} currentUser={this.state.auth.currentUser} handleInfoSelect={this.handleInfoSelect} savedAds={this.state.savedAds} handleSaveAd={this.handleSaveAd} handleUnsaveAd={this.handleUnsaveAd}/> } />

          </Switch>
        </div>
      </Router>
    );
  }
}

export default App


// <Route path="/users/:id" render={()=> !this.state.auth.isLoggedIn ? <Redirect to="/login"/> : <UserProfileContainer currentUser={this.state.auth.currentUser} currentUser={this.state.auth.currentUser}/>}/>
