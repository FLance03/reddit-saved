<style scoped>
    .dropdown-menu {
        max-height: 100vh;
        overflow-y: auto;
    }
</style>
<template>
    <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
        {{choices[currentChoice].text}}
        </a>
        <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
            <li v-for="(choice, index) in choices" :key="index">
                <a @click="setChoice(index)" class="dropdown-item" href="#">{{ choice.text }}</a>
            </li>
        </ul>
    </li>
</template>

<script>

export default {
    props: ['dropdownNumber', 'choices'],
    data() {
        // console.log(this.choices);
        return {
            currentChoice: 0,
        };
    },
    methods: {
        setChoice(index) {
            this.currentChoice = index;
            this.$emit("optionChanged", {dropdownNumber: this.dropdownNumber, choice: index});
        },
    },
}
</script>
