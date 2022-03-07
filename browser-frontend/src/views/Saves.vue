<style scoped>
    #saves {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    th {
        cursor: pointer;
    }
    .table-container {
        width: 100%;
        font-size: 15px;
    }
    a:link {
        color: #337ab7;
        text-decoration: none;
    }   
    a:visited {
        color: black;
    }
    #btn-more-results {
        margin-bottom: 10px;
    }
</style>
<template>
    <div id="saves"> 
        <navbar :dropdowns="dropdowns" @searchPressed="search"></navbar>
        <div class="container table-container">
            <table class="table table-light table-bordered table-striped">
                <thead>
                    <tr>
                        <th @click="sortBy(header)" v-for="(header, index) in headers" :key="index" scope="col">
                            {{ header.value }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(post, index) in getPage(currentPage)" :key="index">
                        <td>{{ post.saveNum }}</td>
                        <td><a :href="'https://www.reddit.com/r/' + post.subreddit">{{post.subreddit}}</a></td>
                        <td>{{post.kind === 't3' ? 'Submission' : 'Comment'}}</td>
                        <td><a :href="post.link">{{displayText(post.text)}}</a></td>
                        <td><a :href="'https://www.reddit.com/u/' + post.author">{{post.author}}</a></td>
                        <td>{{post.created}}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <!-- <button class="btn">Show More Results</button> -->
        <button @click="loadMoreSearchResults" v-if="showingSearchResults" id="btn-more-results" class="container btn btn-primary">
            Show More Results
        </button>
        <nav aria-label="Pages">
            <ul class="container pagination">
                <li v-for="(pageNumber, index) in numberPages" :key="index" class="page-item">
                    <a class="page-link" @click="changePage(pageNumber)" href="#">{{ pageNumber }}</a>
                </li>
            </ul>
        </nav>
    </div>
</template>

<script>

import 'bootstrap/dist/css/bootstrap.min.css';
import 'jquery/src/jquery.js';
import 'bootstrap/dist/js/bootstrap.min.js';
import axios from 'axios';

import Navbar from '../components/Navbar.vue';

// eslint-disable-next-line no-unused-vars
import {search, stemSentences} from '../assets/search.js';


export default {
  name: 'Home',
  components: {
      'navbar': Navbar,
  },
  data() {
      return {
          getSearchResults: search,
          stemSentences: stemSentences,
          showingSearchResults: false,
          searchResults: undefined, // uses generator
          // savesList, savesCount for every saved object
          // displayList for those that are display (e.g. after filter) and 
          // is subset/less from saves
          savesList: [],
          displayList: [],
          lastName: '',
          savesCount: 0,
          headers: [
              {key: 'saveNum', type: Number, value: '#'},
              {key: 'subreddit', type: String, value: 'Subreddit'},
              {key: 'kind', type: String, value: 'Type'},
              {key: 'text', type: String, value: 'Text'},
              {key: 'author', type: String, value: 'Author'},
              {key: 'created', type: String, value: 'Posted'}
          ],
          currentPage: 1,
          pageReturnCount: 20,
          lastSort: {key: 'saveNum', clickCount: 1},
          textColumnMaxLength: 75,
          dropdowns: [
              // key is to identify which was chosen
              // text is the display name when passed to component Navbar
              [
                  // subreddits which is only later pushed
                  {value: undefined, text: 'All Subreddits'}
              ],
              [
                  {value: undefined, text: 'All Posts'},
                  {value: 't1', text: 'Comment'},
                  {value: 't3', text: 'Submission'},
              ],
              [
                {value: 'stemmedText', text: 'Text'},
                {value: 'author', text: 'Author'},
              ],
          ]
      };
  },
  methods: {
      getPage(number) {
          return this.displayList.slice((number - 1) * this.pageReturnCount, number * this.pageReturnCount);
      },
      changePage(number) {
          this.currentPage = number;
      },
      displayText(text) {
          return text.length > this.textColumnMaxLength - 3 
                    ? text.substring(0, this.textColumnMaxLength - 3) + '...' 
                    : text;
      },
      async search({options: options, searchText: search}) {
          // options[k] returns the index of the chosen option from the options of this.dropdowns[k]
          let stemSearch = this.stemSentences(search);
          this.clickCount = 0;
          this.displayList = this.filterOption(this.savesList, 'subreddit', this.dropdowns[0][options[0]].value);
          this.displayList = this.filterOption(this.displayList, 'kind', this.dropdowns[1][options[1]].value);
          if (search == '') {
              this.showingSearchResults = false;
          }else {
              // searchedRecords contains possible matches and those filtered out becomes an empty array in it
              let searchedRecords = [];
              for (let i=0, j=0 ; i<this.savesList.length ; i++) {
                  if (this.savesList[i].saveNum == this.displayList[j].saveNum) {
                      searchedRecords.push(this.savesList[i]);
                      j++;
                  }else {
                      searchedRecords.push([]);
                  }
              }
              this.searchResults = await this.getSearchResults(stemSearch, searchedRecords.map(record => record[this.dropdowns[2][options[2]].value]));
              
              this.displayList = this.getNextSetOfResults();
              this.showingSearchResults = true;
          }
      },
      filterOption(arr, key, value) {
          return value !== undefined 
                    ? arr = arr.filter(record => record?.[key] == value)
                    : arr;
      },
      getNextSetOfResults() {
        return Array.from({length: this.pageReturnCount}, function() {return this.next().value}, this.searchResults)
                    .filter(record => record !== undefined)
                    .map(searchResult => this.savesList[searchResult.index]);
      },
      loadMoreSearchResults() {
          this.displayList.push(...this.getNextSetOfResults());
          this.currentPage = this.numberPages;
          window.scrollTo(0,0);
      },
      sortBy({key, type}) {
          console.log(this.lastSort, key)
          if (this.showingSearchResults) {
              this.displayList = this.savesList;
              this.showingSearchResults = false;
          }
          // If the previous sort column is different, sort in ascending else check last sort order
          if (this.lastSort.key != key) {
              this.lastSort.key = key;
              this.lastSort.clickCount = 1;
          }else {
              this.lastSort.clickCount = this.lastSort.clickCount % 2 == 0 ? 1 : 2;
          }
          let sortOrder;
          if (type === Number) {
            sortOrder = this.lastSort.clickCount == 2 
                                    ? (left, right) => left[0] > right[0] ? -1 : 1
                                    : (left, right) => left[0] < right[0] ? -1 : 1
          }else if (type === String){
            sortOrder = this.lastSort.clickCount == 2 
                                    ? (left, right) => right[0].localeCompare(left[0], 'en', {'sensitivity': 'base'})
                                    : (left, right) => left[0].localeCompare(right[0], 'en', {'sensitivity': 'base'});
          }else {
            sortOrder = undefined;
          }
        console.log(this.displayList.map((record, index) => [record[key], index]));
          let records = this.displayList.map((record, index) => [record[key], index])
                                        .sort(sortOrder);
          this.displayList = records.map(record => this.displayList[record[1]]);
      },
  },
  computed: {
      numberPages() {
          let number = Math.ceil(this.displayList.length / this.pageReturnCount);
          return number == 0 ? 1 : number;
      },
  },
  async beforeMount() {
    let savesLength = await axios({
          url: "http://127.0.0.1:13504/saves/number",
          method: "get",
        //   withCredentials: true,
    });
    let saves = await axios({
        url: "http://127.0.0.1:13504/test",
        method: "get",
        // withCredentials: true,
    });
    console.log(savesLength.data.number);
    this.savesCount = savesLength.data.number;
    
    let subreddits = [];
    for (const [i, post] of saves.data.saves.entries()) {
        subreddits.push(post.subreddit);
        post['saveNum'] = i + 1;
        post['stemmedText'] = this.stemSentences(post.text);
        this.savesList.push(post);
    }
    subreddits = Array.from(new Set(subreddits));
    subreddits.sort((a, b) => a.localeCompare(b, 'en', {'sensitivity': 'base'}));
    this.dropdowns[0] = this.dropdowns[0].concat(subreddits.map(element => new Object({
                                            value: element, text: element,
                                        })));
    this.displayList = this.savesList;
    this.lastName = this.savesList[this.savesList.length - 1].name;
  },
}
</script>