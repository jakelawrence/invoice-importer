import React, { Component } from "react";
import "bootswatch/dist/darkly/bootstrap.min.css";
import Papa from "papaparse";
import "./App.css";
import axios from "axios";
import Modal from "react-modal";
import { Line } from "rc-progress";
import { Beforeunload } from "react-beforeunload";
const CancelToken = axios.CancelToken;
const source = CancelToken.source();
var batch_size = 500;

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
    progress: 0,
    numOfBatches: 1,
    response: "",
  };

  componentWillUnmount() {
    if (source) {
      source.cancel();
    }
  }

  onFileUpload(event) {
    if (event.target.files.length) {
      this.setState({
        fileName: event.target.files[0].name,
        file: event.target.files[0],
        data: null,
      });
    }
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
  }

  openModal() {
    this.setState({ modalIsOpen: true });
  }

  async getData(result) {
    var formattedData = formatData(result.data);
    this.setState({ numOfBatches: formattedData.length });
    for (const batch in formattedData) {
      await axios({
        method: "post",
        url: "https://ec2-3-17-60-63.us-east-2.compute.amazonaws.com/import",
        auth: {
          username: this.state.username,
          password: this.state.password,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        data: {
          csv: formattedData[batch],
          checkPrevImported: batch,
          lastImport: batch < formattedData.length - 1,
        },
        cancelToken: source.token,
      })
        .then((response) => {
          if (response.data.continue) {
            var prev_prog = this.state.progress;
            this.setState({ progress: prev_prog + 1 });
          } else {
            this.setState({
              response: response.data.message,
              completed: true,
            });
          }
        })
        .catch((error) => {
          var error_code = error.response;
          if (error_code && error_code.status === 401) {
            this.setState({ response: "Invalid Credentials", error: true });
          } else if (error_code && error_code === 503) {
            this.setState({
              response: "Error Occured Connecting to Database",
              error: true,
            });
          } else {
            this.setState({
              response: "Something went wrong, whoops!",
              error: true,
            });
          }
        });

      if (this.state.error || this.state.completed) {
        break;
      }
    }
    this.setState({
      uploading: false,
      completed: true,
    });
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

  resetPage() {
    this.setState({
      fileName: "",
      file: null,
      uploading: false,
      completed: false,
      error: false,
      modalIsOpen: false,
      username: "",
      password: "",
      progress: 0,
      numOfBatches: 1,
      response: "",
    });
  }

  render() {
    return (
      <Beforeunload onBeforeunload={() => "You’ll lose your data!"}>
        <div className="App p-5">
          <Modal
            isOpen={this.state.modalIsOpen}
            onRequestClose={this.closeModal.bind(this)}
            style={customStyles}
            contentLabel="API Credentials"
            ariaHideApp={false}
          >
            <button
              className="btn btn-danger"
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
          <div className="bg-secondary m-auto w-50 d-flex flex-column p-5 rounded">
            {!this.state.uploading && !this.state.completed && (
              <>
                <h4>Choose a file to import...</h4>
                <form className="p-5">
                  <label htmlFor="file-upload" className="custom-file-upload">
                    Upload File
                  </label>
                  <input
                    onChange={(event) => this.onFileUpload(event)}
                    id="file-upload"
                    type="file"
                    accept=".csv"
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
                <h4>Importing...</h4>
                <div className="p-3">
                  <Line
                    percent={Math.round(
                      (this.state.progress / this.state.numOfBatches) * 100
                    )}
                    strokeWidth="1.2"
                    strokeColor="#00bc8c"
                  />
                </div>

                {Math.round(
                  (this.state.progress / this.state.numOfBatches) * 100
                )}
                {"%"}
              </div>
            )}
            {!this.state.uploading &&
              this.state.completed &&
              !this.state.error && (
                <div className="d-flex flex-column">
                  <h4>{this.state.response}</h4>
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
                <h4>{this.state.response}</h4>
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
      </Beforeunload>
    );
  }
}

window.onbeforeunload = function () {
  return "";
};

function formatData(data) {
  var batches = [];
  var num_of_batches = Math.ceil(data.length / batch_size);

  for (let i = 0; i < num_of_batches; i++) {
    batches[i] = "";
    var sliced_data = data.slice(i * batch_size, (i + 1) * batch_size);
    sliced_data.forEach((d) => {
      batches[i] = batches[i].concat(d.join("!@#"));
      batches[i] = batches[i].concat("\n");
    });
  }
  return batches;
}

export default App;
