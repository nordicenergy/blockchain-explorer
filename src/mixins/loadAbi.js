export default {
  data() {
    return {
      abi: null,
    };
  },
  methods: {
    loadAbi: function loadAbi(address) {
      fetch(`${process.env.BASE_URL}abi/${address.toLowerCase()}.json`)
        .then(response => response.json())
        .then(abi => {
          this.abi = abi.map(item => {
            switch (item.type) {
            case 'function':
              item.signature = this.$parent.web3js.eth.abi.encodeFunctionSignature(item);
              break;
            case 'event':
              item.signature = this.$parent.web3js.eth.abi.encodeEventSignature(item);
              break;
            }
            item.result = null;
            return item;
          });
        });
    },
  }
}
