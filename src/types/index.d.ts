import Vue from 'vue';
import { BdsApp } from "../bdsApp";

declare module 'vue/types/vue' {
    interface Vue {
        $app: BdsApp;
    }
}
