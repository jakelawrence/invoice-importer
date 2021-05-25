import React, { Component } from "react";
import "bootswatch/dist/darkly/bootstrap.min.css";
import Papa from "papaparse";
import "./App.css";
import axios from "axios";
import Modal from "react-modal";

const customStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.50)",
  },
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    background: "#424242",
    border: "none",
    width: "700px",
  },
};

class App extends Component {
  state = {
    fileName: "",
    file: null,
    uploading: false,
    completed: false,
    error: false,
    modalIsOpen: false,
    username: "",
    password: "",
  };

  onFileUpload(event) {
    this.setState({
      fileName: event.target.files[0].name,
      file: event.target.files[0],
      data: null,
    });
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
  }

  openModal() {
    this.setState({ modalIsOpen: true });
  }

  async getData(result) {
    var formattedData = formatData(result.data);
    console.log("Hello");
    var message = "";
    var isError = false;
    await axios({
      method: "post",
      url: "http://localhost:5000/import",
      auth: {
        username: this.state.username,
        password: this.state.password,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      data: {
        csv: formattedData,
      },
    })
      .then(function (response) {
        message = response.data;
      })
      .catch(function (error) {
        if (error.response.status === 401) {
          message = "Invalid Credentials";
          isError = true;
        }
      });
    if (isError) {
      this.setState({
        uploading: false,
        completed: true,
        error: true,
        response: message,
      });
    } else {
      this.setState({
        uploading: false,
        completed: true,
        response: message,
      });
    }
  }

  changeUsername(e) {
    this.setState({ username: e.target.value });
  }

  changePassword(e) {
    this.setState({ password: e.target.value });
  }

  async onSubmit() {
    this.setState({ uploading: true, modalIsOpen: false });
    Papa.parse(this.state.file, {
      complete: this.getData.bind(this),
    });
  }

  getCredentials() {
    if (this.state.file) {
      this.setState({ modalIsOpen: true });
    }
  }

  async onLogin(details) {
    console.log(details);
  }

  resetPage() {
    this.setState({ completed: false, fileName: "", file: null });
  }

  render() {
    return (
      <div className="App p-5">
        <Modal
          isOpen={this.state.modalIsOpen}
          onRequestClose={this.closeModal.bind(this)}
          style={customStyles}
          contentLabel="API Credentials"
          ariaHideApp={false}
        >
          <button
            className="btn btn-primary"
            onClick={this.closeModal.bind(this)}
          >
            close
          </button>
          <div className="d-flex flex-column m-2 p-5">
            <h3 className="pb-2">Enter Credentials</h3>
            <div className="form-group">
              <label className="py-2" htmlFor="username">
                Username
              </label>
              <input
                type="text"
                className="form-control"
                id="username"
                placeholder="username"
                onChange={this.changeUsername.bind(this)}
              ></input>
            </div>
            <div className="form-group">
              <label className="py-2" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="password"
                onChange={this.changePassword.bind(this)}
              ></input>
            </div>
            <button
              onMouseUp={() => this.onSubmit()}
              className="btn btn-primary mt-5"
            >
              Submit
            </button>
          </div>
        </Modal>
        <h1 className="p-5">Import Invoice Charges</h1>
        <div className="bg-secondary m-auto w-50 d-flex flex-column p-5">
          {!this.state.uploading && !this.state.completed && (
            <>
              Choose a file to import...
              <form className="p-5">
                <label htmlFor="file-upload" className="custom-file-upload">
                  Upload File
                </label>
                <input
                  onChange={(event) => this.onFileUpload(event)}
                  id="file-upload"
                  type="file"
                />
                <div className="p-2">{this.state.fileName}</div>
              </form>
              <button
                onMouseUp={() => this.getCredentials()}
                className="btn btn-primary mx-5"
              >
                Import
              </button>
            </>
          )}
          {this.state.uploading && !this.state.completed && (
            <div className="d-flex flex-column">
              Importing...
              <div className="spinner-border m-auto mt-3" role="status"></div>
            </div>
          )}
          {!this.state.uploading && this.state.completed && !this.state.error && (
            <div className="d-flex flex-column">
              {this.state.response}
              <button
                onMouseUp={() => this.resetPage()}
                className="btn btn-primary m-5"
              >
                Import Another File
              </button>
            </div>
          )}
          {!this.state.uploading && this.state.completed && this.state.error && (
            <div className="d-flex flex-column">
              {this.state.response}
              <button
                onMouseUp={() => this.resetPage()}
                className="btn btn-danger m-5"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

function formatData(data) {
  var formattedData = "";
  data.forEach((d) => {
    formattedData = formattedData.concat(d.join("!@#"));
    formattedData = formattedData.concat("\n");
  });
  return formattedData;
}

export default App;
