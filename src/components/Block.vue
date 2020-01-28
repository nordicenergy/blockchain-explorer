<template>
  <div id="block-container">
    <div class="section-title">
      <h3>Block</h3>
      <div id="block-standin" v-if="!block">
        <p>(Retrieving block...)</p>
      </div>
    </div>
    <div class="table-container table-responsive">
      <table id="block" v-if="!!block" class="table table-striped">
        <tbody>
        <tr v-for="(value, key) in block" :key="key">
          <td>
            {{ key }}
          </td>
          <td class="word-break">
            <span v-if="key==='timestamp'">{{ value | datetime }}</span>
            <span v-else-if="key==='transactions'">
              <span v-for="tx in value" :key="tx">
                <router-link :to="`/tx/${tx}`">{{ tx }}</router-link>
              </span>
            </span>
            <span v-else>{{ value }}</span>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Block',
    data() {
      return {
        block: null,
      };
    },
    beforeRouteEnter(to, from, next) {
      next(vm => {
        vm.getBlock(vm.$route.params.id, true);
      })
    },
    methods: {
      getBlock: function getBlock(id) {
        this.$parent.web3js.eth.getBlock(id).then(block => {
          this.block = block;
        });
      }
    }
  }
</script>
