<template>
    <div class="modal fade" id="otherAccountModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">Copy saves from another reddit account</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="exampleInputEmail1" class="form-label">Second account username</label>
                        <div class="input-group mb-3">
                            <span class="input-group-text" id="basic-addon1">u/</span>
                            <input v-model="fromUsername" type="text" id="usernameInput" class="form-control" aria-describedby="usernameHelp" placeholder="other_acct_username">
                        </div>
                        <div id="usernameHelp" class="form-text">Username of the account to copy saves <em>to</em></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button @click="copySaves()" type="button" class="btn btn-primary">Copy</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

export default {
    data() {
        return {
            fromUsername: '',
        };
    },
    methods: {
        copySaves() {
            this.$emit('copySaves', this.fromUsername);
        }
    }
}

</script>

