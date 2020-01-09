<template>
  <div id="app">

    <nav class="navbar navbar-inverse navbar-fixed-top">
      <div class="container-fluid top-header">
        <router-link to="/" class="logo">
          <img src="https://www.lition.io/wp-content/uploads/2018/03/lition-logo-secondary-white@3x.png">
        </router-link>

        <div class="form-inline">
          <label for="selected-provider">Provider</label>
          <select class="form-control" id="selected-provider" v-model="selectedProvider" v-on:change="changeProvider()">
            <option v-for="i in availableNodes" v-bind:value="i" v-bind:key="i.rpc">{{ i.nodeName }}</option>
          </select>
        </div>

        <form class="form-inline" v-on:submit.prevent="search()">
          <label for="input">Search</label>
          <div class="input-group">
            <input type="text" class="form-control" id="input" v-model="input"
                   placeholder="block, transaction, address">
            <span class="input-group-btn">
              <button type="submit" class="btn btn-default">go</button>
            </span>
          </div>
        </form>
      </div>

      <div class="alert alert-warning alert-dismissible" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
        <div class="message">warning</div>
      </div>

      <div class="alert alert-info alert-dismissible" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
        <div class="message">info</div>
      </div>

      <div class="alert alert-danger alert-dismissible" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
        <div class="message">danger</div>
      </div>
    </nav>

    <div class="container-fluid header">
      <div class="row no_overflow headerimage">
        <div class="col-md-12">
          <div class="container-fluid title-container">
            <h1><strong>Nordic Energy Blockchain Explorer for Energy Case</strong></h1>
            <br>
            <div class="container-fluid text-left contact-container">
              <router-view></router-view>
            </div>
          </div>
        </div>
        <div class="circle_container">
          <div class="circle"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import config from './config.js'
  import Web3 from 'web3'
  import numberToBN from 'number-to-bn'

  export default {
    name: "app",
    data() {
      return {
        networkId: 0,
        networkName: '(to be determined)',
        web3js: false,
        config: {},
        input: '',
        selectedProvider: null,
        availableNodes: [],
      };
    },
    mounted() {
      this.networkId = process.env.VUE_APP_NETWORK;
      this.config = config[this.networkId];
      this.networkName = this.config.name;
      this.web3js = new Web3(this.config.rpc);
      this.web3js.extend({
        property: 'eth',
        methods: [new this.web3js.extend.Method({
          name: 'getQuorumPayload',
          call: 'eth_getQuorumPayload',
          params: 1,
        })]
      });
      this.web3js.utils.hexToNumber = v => {
        if (!v) return v;
        try {
          return numberToBN(v).toNumber();
        } catch (e) {
          return numberToBN(v).toString();
        }
      };
      this.getNodes();
    },
    methods: {
      search: function search() {
        switch (this.input.length) {
        case 66:
          this.web3js.eth.getBlock(this.input).then(block => {
            if (block) {
              this.$router.push(`/block/${this.input}`);
            } else {
              this.$router.push(`/tx/${this.input}`);
            }
          });
          break;
        case 42:
          this.$router.push(`/address/${this.input}`);
          break;
        default:
          this.web3js.eth.getBlock(this.input).then(block => {
            if (block) {
              this.$router.push(`/block/${block.hash}`);
            }
          });
          break;
        }
      },
      getNodes: async function () {
        const rpc = new URL(this.config.rpc);
        const manager = new URL(this.config.manager);
        await fetch(`${this.config.manager}/getNodeList`)
          .then(r => r.json())
          .then(r => {
            this.availableNodes = r.map(i => {
              rpc.hostname = i.ip;
              manager.hostname = i.ip;
              return {
                nodeName: i.nodeName,
                publicKey: i.publicKey,
                rpc: rpc.toString(),
                manager: manager.toString(),
              };
            });
          });
        this.selectedProvider = this.availableNodes.find(i => i.rpc === this.config.rpc);
      },
      changeProvider: function () {
        const provider = new Web3.providers.HttpProvider(this.selectedProvider.rpc);
        this.web3js.setProvider(provider);
      },
    },
  };
</script>

<style>
  #app {
    font-family: "Avenir", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #fff;
  }

  nav.navbar {
    min-height: 100px;
    background-color: rgba(5, 26, 46, 0.9);
  }

  nav.navbar > .alert {
    display: none;
    margin-bottom: 0;
  }

  div.top-header {
    min-height: 100px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }

  .logo {
    margin-right: auto;
  }

  .top-header .form-inline {
    margin-left: 10px;
  }

  .top-header label {
    margin-right: 3px;
  }

  div.title-container {
    margin-top: 40px;
    color: white;
  }

  div.contact-container {
    margin-left: 25px;
  }

  div.title-container input {
    color: #2c3e50;
  }

  div.no_overflow {
    overflow: hidden;
  }

  div.header {
    background: linear-gradient(to right, rgb(9, 31, 52), rgb(40, 92, 133));
  }

  div.circle_container {
    height: 0;
  }

  div.circle_container div.circle {
    border-radius: 50%;
    width: 10000px;
    height: 10000px;
    background: black;

    margin-left: -4000px;
    margin-top: 200px;
  }

  div.headerimage {
    background-image: url('https://www.lition.io/wp-content/uploads/2018/03/180327-den-stage-illusration@3x.png');
    background-position: top right;
    background-repeat: no-repeat;
    background-size: 200px;
    margin-top: 130px;
  }

  div.table-container {
    margin-top: 20px;
  }

  thead th {
    text-align: center;
  }

  .word-break {
    word-break: break-all;
  }

  .margin-bottom-xs {
    margin-bottom: .25em;
  }

  .margin-bottom-sm {
    margin-bottom: .5em;
  }

  .margin-bottom-md {
    margin-bottom: 1em;
  }

  .margin-bottom-lg {
    margin-bottom: 1.5em;
  }

  .margin-bottom-xl {
    margin-bottom: 3em;
  }

  @media only screen and (max-width: 992px) {
    div.title-container {
      margin-top: 30px;
    }

    div.circle_container {
      height: 150px;
    }

    div.circle_container div.circle {
      margin-top: 0%;
    }
  }

  @media only screen and (max-width: 770px) {
    .top-header .form-inline {
      margin-left: 0;
    }

    .top-header .form-inline label {
      display: none;
    }
  }
</style>
