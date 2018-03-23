<template>
<div>
	<v-app id="nyaa">
		<v-toolbar color="cyan" dark="dark" tabs="tabs">
			<v-toolbar-side-icon></v-toolbar-side-icon>
			<v-toolbar-title>NyaaNotify!!</v-toolbar-title>
			<v-spacer></v-spacer>
			<v-btn icon="icon">
				<v-icon>search</v-icon>
			</v-btn>
			<v-btn icon="icon">
				<v-icon>more_vert</v-icon>
			</v-btn>
			<v-tabs color="cyan" slot="extension" v-model="currentTab" align-with-title="align-with-title">
				<v-tabs-slider color="yellow"></v-tabs-slider>
				<v-tab v-for="tab in tabs" :key="tab.title">
					{{ tab.title }}
				</v-tab>
			</v-tabs>

		</v-toolbar>
		<v-tabs-items v-model="currentTab">
			<v-tab-item v-for="tab in tabs" :key="tab.title">
				<v-card flat="flat">
					<v-card-text>{{ tab.content }}</v-card-text>
				</v-card>

			</v-tab-item>
		</v-tabs-items>

		<v-btn absolute dark fab bottom right color="pink">
			<v-icon>add</v-icon>
		</v-btn>
	</v-app>
</div>
</template>

<script>
import { fetchQuery } from '../api'

export default {
  name: 'App',
  data() {
    return {
      currentTab: null,
      tabs: [
        { title: 'New', content: 'New content', },
        { title: 'All', content: 'All content', },
      ],
    }
  },
  computed: {},
  methods: {
    fq(q) {
      fetchQuery(q)
        .then(r => {
          console.info('fq: ', r)
        })
    }
  },
}
</script>

<style>
html {
	overflow: auto;
}
</style>
