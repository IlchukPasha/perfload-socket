import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import socket from './utilities/socketConnection';


class App extends Component {
  constructor(){
    super();
    this.state = {
      performanceData: {}
    }
  }

  componentDidMount(){
    socket.on('data', data => {
      console.log('in react');
    });
  }

  render() {
    return (
      <div className="App">
      </div>
    );
  }
}

export default App;
