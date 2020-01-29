<template>
  <div id="addrss-container">
    <div class="section-title">
      <h3>Address: {{ $route.params.id }}</h3>
    </div>

    <div>
      <ul class="nav nav-tabs margin-bottom-xl" role="tablist">
        <li role="presentation" class="active">
          <a href="#info" aria-controls="info" role="tab" data-toggle="tab">Info</a>
        </li>
        <li role="presentation" v-if="abi">
          <a href="#events" aria-controls="events" role="tab" data-toggle="tab">Events</a>
        </li>
        <li role="presentation" v-if="abi">
          <a href="#read" aria-controls="read" role="tab" data-toggle="tab">Read</a>
        </li>
        <li role="presentation" v-if="abi">
          <a href="#write" aria-controls="write" role="tab" data-toggle="tab">Write</a>
        </li>
      </ul>

      <div class="tab-content">
        <div role="tabpanel" class="tab-pane active" id="info">
          <h3>Transactions: {{ transactionCount }}</h3>
        </div>

        <div role="tabpanel" class="tab-pane" id="events" v-if="abi">
          <div>
            <button class="btn btn-default" :disabled="lastBlockNumber === lastNetworkBlockNumber"
                    v-on:click="nextBlocks()">&#60;
            </button>
            {{ lastBlockNumber - blocksPerPage + 1 }} - {{ lastBlockNumber + 1 }}
            <button class="btn btn-default" :disabled="lastBlockNumber === (blocksPerPage - 1)"
                    v-on:click="prevBlocks()">&#62;
            </button>

            <div v-if="decodedEvents && decodedEvents.length > 0">
              <div v-for="(decodedEvent, i) in decodedEvents" :key="i" class="table-container table-responsive">
                <table id="decoded-event" class="table table-striped">
                  <tbody>
                  <tr v-for="(value, key) in decodedEvent" :key="key">
                    <td>
                      {{ key }}
                    </td>
                    <td class="word-break">
                      <span v-if="key==='blockHash'">
                        <router-link :to="`/block/${value}`">{{ value }}</router-link>
                      </span>
                      <span v-else-if="key==='transactionHash'">
                        <router-link :to="`/tx/${value}`">{{ value }}</router-link>
                      </span>
                      <span v-else-if="key==='returnValues'">
                        {{ value | cleanDecodedObject }}
                      </span>
                      <span v-else>{{ value }}</span>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else>no events</div>

            <button class="btn btn-default" :disabled="lastBlockNumber === lastNetworkBlockNumber"
                    v-on:click="nextBlocks()">&#60;
            </button>
            {{ lastBlockNumber - blocksPerPage + 1 }} - {{ lastBlockNumber + 1 }}
            <button class="btn btn-default" :disabled="lastBlockNumber === (blocksPerPage - 1)"
                    v-on:click="prevBlocks()">&#62;
            </button>
          </div>
        </div>

        <div role="tabpanel" class="tab-pane" id="read" v-if="abi">
          <div class="form-inline">
            Block: <input class="form-control" v-model="readBlock"/>
            <div class="margin-bottom-lg" v-for="(item, i) in abi.filter(item => item.constant)" :key="i">
              <div>{{ i + 1 }}. {{ item.name }}</div>
              <div class="margin-bottom-sm" v-for="(input, k) in item.inputs" :key="k">
                <input class="form-control" v-model="input.value" :placeholder="input.name"/>
                {{ input.type }}
              </div>
              <div class="margin-bottom-sm">
                <button class="btn btn-default" v-on:click="call(item)">query</button>
              </div>
              <div>
                <table id="decoded-result" class="table table-striped">
                  <tbody>
                  <tr v-for="(value, key) in item.result" :key="key">
                    <td>
                      {{ key }}
                    </td>
                    <td class="word-break">
                      <span v-if="key==='timestamp'">{{ value | datetime}}</span>
                      <span v-else>{{ value }}</span>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div role="tabpanel" class="tab-pane" id="write" v-if="abi">
          <div class="form-inline">
            Private for:
            <select class="form-control" multiple v-model="privateFor">
              <option v-for="i in $parent.availableNodes" v-bind:value="i.publicKey" v-bind:key="i.publicKey">
                {{ i.nodeName }}
              </option>
            </select>
            <div class="margin-bottom-lg" v-for="(item, i) in abi.filter(item => item.constant === false)" :key="i">
              <div>{{ i + 1 }}. {{ item.name }}</div>
              <div class="margin-bottom-sm" v-for="(input, k) in item.inputs" :key="k">
                <input class="form-control" v-model="input.value" :placeholder="input.name"/>
                {{ input.type }}
              </div>
              <div class="margin-bottom-sm">
                <button class="btn btn-default" v-on:click="send(item)">write</button>
              </div>
              <div>
                <table id="result" class="table table-striped">
                  <tbody>
                  <tr v-for="(value, key) in item.result" :key="key">
                    <td>
                      {{ key }}
                    </td>
                    <td class="word-break">
                      <span v-if="key==='timestamp'">{{ value | datetime}}</span>
                      <span v-else>{{ value }}</span>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import loadAbi from '../mixins/loadAbi'

  export default {
    name: 'Address',
    mixins: [loadAbi],
    data() {
      return {
        transactionCount: 0,
        isContract: false,
        contract: null,
        decodedEvents: null,
        abi: null,
        readBlock: 'latest',
        lastNetworkBlockNumber: null,
        lastBlockNumber: null,
        blocksPerPage: 10,
        autoUpdate: true,
        privateFor: [],
      }
    },
    beforeRouteEnter(to, from, next) {
      next(vm => {
        vm.getTransactionCount();
        vm.getCode()
      })
    },
    watch: {
      isContract: function () {
        this.getAbi();
      },
      abi: function () {
        // todo: warning about missing ABI in contract metadata
        this.getEvents();
      },
      '$parent.selectedProvider': async function () {
        if (!this.contract) return;

        this.contract.setProvider(this.$parent.selectedProvider);

        const accounts = await this.$parent.web3js.eth.getAccounts();
        this.contract.options.from = accounts[0];
      },
    },
    methods: {
      getTransactionCount: function getTransactionCount() {
        this.$parent.web3js.eth.getTransactionCount(this.$route.params.id).then(transactionCount => {
          this.transactionCount = transactionCount;
        });
      },
      getCode: function getCode() {
        this.$parent.web3js.eth.getCode(this.$route.params.id).then(code => {
          this.isContract = code !== '0x';
        });
      },
      getAbi: function getAbi() {
        this.loadAbi(this.$route.params.id);
      },
      getEvents: async function getEvents() {
        this.lastNetworkBlockNumber = await this.$parent.web3js.eth.getBlockNumber();
        if (this.autoUpdate) {
          if (this.lastBlockNumber === this.lastNetworkBlockNumber) return;
          this.lastBlockNumber = this.lastNetworkBlockNumber;
        } else {
          if (this.lastBlockNumber >= this.lastNetworkBlockNumber) this.lastBlockNumber = this.lastNetworkBlockNumber;
          if (this.lastBlockNumber < (this.blocksPerPage - 1)) this.lastBlockNumber = this.blocksPerPage - 1;
        }
        const accounts = await this.$parent.web3js.eth.getAccounts();
        this.contract = new this.$parent.web3js.eth.Contract(this.abi, this.$route.params.id, { from: accounts[0] });
        this.contract.getPastEvents('allEvents', {
          fromBlock: this.lastBlockNumber - this.blocksPerPage,
          toBlock: this.lastBlockNumber,
        })
          .then(events => this.decodedEvents = events);
      },
      call: function (item) {
        const values = item.inputs.map(input => input.value);
        this.contract.methods[item.name](...values).call({}, this.readBlock)
          .then(result => {
            result = this.$options.filters.cleanDecodedObject(result);
            item.result = result;
          })
          .catch(() => {
            item.result = {};
          });
      },
      send: async function (item) {
        await this.$parent.web3js.eth.personal.unlockAccount(this.contract.options.from);
        const values = item.inputs.map(input => input.value);
        this.contract.methods[item.name](...values).send({
          privateFor: this.privateFor.filter(i => i !== this.$parent.selectedProvider.publicKey),
        })
          .then(result => {
            item.result = result;
          })
          .catch(e => {
            console.error(e);
            $('.alert-info > .message').text(e.message);
            $('.alert-info').show();
          });
      },
      prevBlocks: function prevBlocks() {
        this.autoUpdate = false;
        this.lastBlockNumber = this.lastBlockNumber - this.blocksPerPage;
        this.getEvents();
      },
      nextBlocks: function nextBlocks() {
        this.autoUpdate = false;
        this.lastBlockNumber = this.lastBlockNumber + this.blocksPerPage;
        this.getEvents();
      },
    }
  }
</script>
