<style scoped>
    .navbar-div {
        width: 100%;
        margin-bottom: 2.5%;
    }
    .testt {
        width: 1000%;
    }
</style>
<template>
    <div class="navbar-div">
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
            <div class="container container-fluid">
                <a class="navbar-brand" href="#">Reddit Saves</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        <li class="nav-item">
                            <a class="nav-link active" aria-current="page" href="#">Save</a>
                        </li>
                        <li class="nav-item">
                            <a @click="importToDB()" class="nav-link" href="#">Import to DB</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" data-bs-toggle="modal" data-bs-target="#otherAccountModal" href="#">Copy to another account</a>
                        </li>
                        <modal @copySaves="copySaves"></modal>
                        <!-- <li class="nav-item">
                            <a class="nav-link disabled">Disabled</a>
                        </li> -->
                    </ul>

                    <ul v-for="(dropdown, index) in dropdowns" :key="index" class="navbar-nav mb-2 mb-lg-0 d-flex">
                        <dropdown :dropdownNumber="index" :choices="dropdown" @optionChanged="setDropdownOptions"></dropdown>
                    </ul>
                    <div class="d-flex col-4">
                        <input v-model="searchText" @keyup.enter="triggerSearch" class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
                        <button @click="search()" ref="searchButton" class="btn btn-outline-light" type="submit">Search</button>
                    </div>
                </div>
            </div>
        </nav>
    </div>
</template>
<script>
import axios from 'axios';
import qs from 'qs';

import Modal from './Modal.vue';
import Dropdown from './Dropdown.vue';

export default {
  components: { 'dropdown': Dropdown, 'modal': Modal },
    props: ['dropdowns'],
    data() {
        return {
            // dropdownOptions contains the indices of each dropdown choice chosen where the contents
            // of the dropdown was defined by the parent. dropdownOptions index k is the chosen option
            // from the list of options defined from the parent (dropdowns in Saves.vue) at index k.
            dropdownOptions: new Array(this.dropdowns.length).fill(0),
            searchText: "",
        };
    },
    methods: {
        setDropdownOptions({dropdownNumber, choice}) {
            this.dropdownOptions[dropdownNumber] = choice;
        },
        triggerSearch() {
            this.$refs.searchButton.click();
        },
        search() {
            this.$emit("searchPressed", {
                options: this.dropdownOptions,
                searchText: this.searchText,
            });
        },
        importToDB() {
            axios({
                url: 'http://127.0.0.1:13504/saves/sync',
                method: 'post',
                withCredentials: true,
            });
        },
        copySaves(fromUsername) {
            axios({
                url: 'http://127.0.0.1:13504/saves/duplicate',
                method: 'post',
                withCredentials: true,
                data: qs.stringify({
                    from: fromUsername
                }), 
            });
        }
    },
    // computed: {
    //     filters() {
    //         return ['Subreddit', 'Text', 'Author']
    //     }
    // }
};
</script>
