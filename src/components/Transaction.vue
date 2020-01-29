<template>
  <div id="transaction-container">
    <div class="section-title">
      <h3>Transaction</h3>
      <div id="transaction-standin" v-if="!transaction">
        <p>(Retrieving transaction...)</p>
      </div>
    </div>
    <div class="table-container table-responsive">
      <table id="transaction" v-if="!!transaction" class="table table-striped">
        <tbody>
        <tr v-for="(value, key) in transaction" :key="key">
          <td>
            <b>
              {{ key }}
            </b>
          </td>
          <td class="word-break">
            <span v-if="key==='from' || key==='to'">
              <router-link :to="`/address/${value}`">{{ value }}</router-link>
            </span>
            <span v-else-if="key==='blockHash'">
              <router-link :to="`/block/${value}`">{{ value }}</router-link>
            </span>
            <span v-else>{{ value }}</span>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="section-title">
      <h3>Receipt</h3>
      <div id="receipt-standin" v-if="!receipt">
        <p>(Retrieving receipt...)</p>
      </div>
    </div>
    <div class="table-container table-responsive">
      <table id="receipt" v-if="!!receipt" class="table table-striped">
        <tbody>
        <tr v-for="(value, key) in receipt" :key="key">
          <td>
            <b>
              {{ key }}
            </b>
          </td>
          <td class="word-break">
            {{ value }}
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="section-title">
      <h3>Decoded Input</h3>
      <div id="decoded-input-standin" v-if="!decodedInput">
        <p>(Not available...)</p>
      </div>
    </div>
    <div class="table-container table-responsive">
      <table id="decoded-input" v-if="!!decodedInput" class="table table-striped">
        <tbody>
        <tr v-for="(value, key) in decodedInput" :key="key">
          <td>
            <b>
              {{ key }}
            </b>
          </td>
          <td class="word-break">
            {{ format(key, value) }}
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="section-title">
      <h3>Decoded Events</h3>
      <div id="decoded-events-standin" v-if="!decodedEvents">
        <p>(Not available...)</p>
      </div>
    </div>
    <div>
      <div v-for="(decodedEvent, i) in decodedEvents" :key="i" class="table-container table-responsive">
        <table id="decoded-event" class="table table-striped">
          <tbody>
          <tr v-for="(value, key) in decodedEvent" :key="key">
            <td>
              {{ key }}
            </td>
            <td class="word-break">
              {{ value }}
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <button v-if="isPrivate && !deleted" v-on:click="deleteData()" class="btn btn-success btn-lg">Delete data</button>
  </div>
</template>

<script>
  import loadAbi from "../mixins/loadAbi";

  export default {
    name: 'Transaction',
    mixins: [loadAbi],
    data() {
      return {
        isPrivate: false,
        deleted: false,
        transaction: null,
        receipt: null,
        abi: null,
        decodedInput: null,
        decodedEvents: null,
      };
    },
    beforeRouteEnter(to, from, next) {
      next(vm => {
        vm.getTransaction(vm.$route.params.id);
        vm.getReceipt(vm.$route.params.id);
      })
    },
    watch: {
      transaction: function () {
        this.getAbi();
      },
      abi: function () {
        this.decode();
      },
    },
    methods: {
      getTransaction: function getTransaction(id) {
        this.$parent.web3js.eth.getTransaction(id).then(async transaction => {
          if (!transaction) {
            $('.alert-danger > .message').text('Transaction not found');
            $('.alert-danger').show();
            return;
          }
          if (transaction.v === '0x25' || transaction.v === '0x26') this.isPrivate = true;
          if (this.isPrivate) transaction.input = await this.$parent.web3js.eth.getQuorumPayload(transaction.input);
          this.transaction = transaction;
          if (this.transaction.input === '0x') {
            this.deleted = true;
            $('.alert-warning > .message').text('Transaction found, but data is deleted');
            $('.alert-warning').show();
          }
        });
      },
      getReceipt: function getReceipt(id) {
        this.$parent.web3js.eth.getTransactionReceipt(id).then(receipt => {
          this.receipt = receipt;
        });
      },
      getAbi: function getAbi() {
        if (this.deleted) return;
        this.loadAbi(this.transaction.to);
      },
      decode: function decode() {
        const abi = this.abi.filter(item => this.transaction.input.startsWith(item.signature))[0];
        const data = `0x${this.transaction.input.slice(10)}`;
        const decodedInput = this.$parent.web3js.eth.abi.decodeParameters(abi.inputs, data);
        decodedInput.__name = abi.name;
        this.decodedInput = this.$options.filters.cleanDecodedObject(decodedInput);
        this.decodedEvents = this.receipt.logs.map(log => {
          const abi = this.abi.filter(item => log.topics[0] === item.signature)[0];
          const decodedEvent = this.$parent.web3js.eth.abi.decodeLog(abi.inputs, log.data, log.topics.slice(1));
          decodedEvent.__event = abi.name;
          return this.$options.filters.cleanDecodedObject(decodedEvent);
        });
      },
      deleteData: function deleteData() {
        if (confirm('Are you sure?')) {
          // todo: remove from other nodes
          fetch(`${this.$parent.config.manager}/rmpld/${this.transaction.hash}`).finally(() => {
            $('.alert-info > .message').text('Data is deleted');
            $('.alert-info').show();
          });
        }
      },
      // todo: move to abi
      format: function format(key, param) {
        return this[key] ? this[key](param) : param;
      },
      aday: function aday(aday) {
        return new Date(aday * 1.0e3).toLocaleString();
      },
      aprice: function aprice(aprice) {
        return `${(aprice / 1.0e3).toFixed(3)} ct/kWh`;
      },
      aenergy: function aenergy(aenergy) {
        return `${(aenergy / 1.0e6).toFixed(6)} kWh`;
      },
      'atimestamp-definition': function atimestamp(atimestamp) {
        return `
                ${(atimestamp / 1.0e9).toFixed(3)} s since 1970
                (${((Date.now() / 1.0e3) - (atimestamp / 1.0e9)).toFixed(3)} s ago
                or ${new Date(atimestamp / 1.0e6).toDateString()})
                or did you mean ${new Date(atimestamp / 1.0e3).toDateString()}?
            `;
      },
      atimestamp: function atimestamp(atimestamp) {
        if (atimestamp === '0') atimestamp = Date.now() * 1.0e3;
        return `
                ${new Date(atimestamp / 1.0e3).toLocaleString()}
                (${((Date.now() / 1.0e3) - (atimestamp / 1.0e6)).toFixed(0)} s ago)
            `;
      },
      auserID: function auserID(auserID) {
        return `User with ID ${auserID}`;
      },
    }
  }
</script>
