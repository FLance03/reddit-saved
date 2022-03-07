<style scoped>
  .home {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    background-image: linear-gradient(to bottom right, red, rgba(0, 0, 0, 0.767));
    width: 100%;
    height: 100%;
  }
  .home>div {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
  .home>div:nth-child(1) {
    color: white;
  }
</style>

<template>
  <div class="home">
    <div class="a">
      <p class="fs-1">Manage your reddit saved posts and comments</p>
    </div>
    <div class="b">
      <form method="POST" action="http://127.0.0.1:13504/redirect-authorize">
        <button type="submit" class="btn btn-light">Login with Reddit</button>
      </form>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src

import 'bootstrap/dist/css/bootstrap.min.css'
import 'jquery/src/jquery.js'
import 'bootstrap/dist/js/bootstrap.min.js'

export default {
  name: 'Home',
  components: {
  }
}
</script>

