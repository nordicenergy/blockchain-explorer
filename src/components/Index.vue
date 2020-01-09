<template>
  <div id="index-container">
    <h3>Network: {{ $parent.networkName }}</h3>
    <h3>Nodes Online: {{ peers + 1 }}</h3>
    <div class="section-title">
      <h3>Blocks</h3>
      <div id="blocks-standin" v-if="!blocks">
        <p>(Retrieving blocks...)</p>
      </div>
    </div>
    <div class="table-container table-responsive">
      <table id="blocks" v-if="!!blocks" class="table table-striped">
        <thead>
        <tr>
          <th>#</th>
          <th>Timestamp</th>
          <th>Hash</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="block in blocks" :key="block.id">
          <td>
            <router-link :to="`/block/${block.hash}`">{{ block.number }}</router-link>
          </td>
          <td>
            <router-link :to="`/block/${block.hash}`">{{ block.timestamp | datetime }}</router-link>
          </td>
          <td>
            <router-link :to="`/block/${block.hash}`">{{ block.hash }}</router-link>
          </td>
        </tr>
        </tbody>
      </table>
      <button class="btn btn-default" :disabled="lastBlockNumber === lastNetworkBlockNumber" v-on:click="nextBlocks()">
        &#60;
      </button>
      <button class="btn btn-default" :disabled="lastBlockNumber === (blocksPerPage - 1)" v-on:click="prevBlocks()">
        &#62;
      </button>
    </div>

    <div class="section-title">
      <h3>Transactions</h3>
      <div id="transactions-standin" v-if="!transactions">
        <p>(Retrieving transactions...)</p>
      </div>
    </div>
    <div class="table-container table-responsive">
      <table id="transactions" v-if="!!transactions" class="table table-striped">
        <thead>
        <tr>
          <th>From</th>
          <th>To</th>
          <th>Hash</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="transaction in transactions" :key="transaction.id">
          <td>
            <router-link :to="`/address/${transaction.from}`">{{ transaction.from }}</router-link>
          </td>
          <td>
            <router-link :to="`/address/${transaction.to}`">{{ transaction.to }}</router-link>
          </td>
          <td>
            <router-link :to="`/tx/${transaction.hash}`">{{ transaction.hash }}</router-link>
          </td>
        </tr>
        </tbody>
      </table>
      <button class="btn btn-default" :disabled="lastBlockNumber === lastNetworkBlockNumber" v-on:click="nextBlocks()">
        &#60;
      </button>
      <button class="btn btn-default" :disabled="lastBlockNumber === (blocksPerPage - 1)" v-on:click="prevBlocks()">
        &#62;
      </button>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Index',
    data() {
      return {
        peers: 0,
        blocks: [],
        transactions: [],
        lastNetworkBlockNumber: null,
        lastBlockNumber: null,
        blocksPerPage: 10,
        autoUpdate: true,
      };
    },
    beforeRouteEnter(to, from, next) {
      next(vm => {
        vm.getPeers();
        vm.getBlocks();
        setInterval(() => {
          if (vm.autoUpdate) vm.getBlocks();
        }, 5 * 1000);
      })
    },
    methods: {
      getPeers: function getPeers() {
        this.$parent.web3js.eth.net.getPeerCount()
          .then(count => this.peers = count);
      },
      getBlocks: async function getBlocks() {
        this.lastNetworkBlockNumber = await this.$parent.web3js.eth.getBlockNumber();
        if (this.autoUpdate) {
          if (this.lastBlockNumber === this.lastNetworkBlockNumber) return;
          this.lastBlockNumber = this.lastNetworkBlockNumber;
        } else {
          if (this.lastBlockNumber >= this.lastNetworkBlockNumber) this.lastBlockNumber = this.lastNetworkBlockNumber;
          if (this.lastBlockNumber < (this.blocksPerPage - 1)) this.lastBlockNumber = this.blocksPerPage - 1;
        }
        const args = [];
        for (let i = 0; i < this.blocksPerPage; i++) {
          args.push({
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: ['0x' + (this.lastBlockNumber - i).toString(16), true],
            id: i,
          });
        }
        fetch(this.$parent.web3js._provider.host, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args),
        })
          .then(r => r.json())
          .then(r => r.sort((a, b) => a.id - b.id))
          .then(r => {
            this.blocks = r.map(i => i.result).map(this.$parent.web3js.extend.formatters.outputBlockFormatter);
            this.transactions = this.blocks.reduce((acc, x) => acc.concat(x.transactions), []);
          });
      },
      prevBlocks: function prevBlocks() {
        this.autoUpdate = false;
        this.lastBlockNumber = this.lastBlockNumber - this.blocksPerPage;
        this.getBlocks();
      },
      nextBlocks: function nextBlocks() {
        this.autoUpdate = false;
        this.lastBlockNumber = this.lastBlockNumber + this.blocksPerPage;
        this.getBlocks();
      },
    }
  }
</script>
