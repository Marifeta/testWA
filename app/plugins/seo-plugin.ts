
const project = ref('курлык');

export default defineNuxtPlugin(nuxtApp => {
    project.value = useRequestURL().host.includes('marifeta') ? 'курлык' : 'гуль-гуль';

    const updateMeta = () => {
        const route = useRoute();
        const customTitle = route.meta.title || 'Страница';
        let title = `${project.value}`;

        if (route.path !== '/') {
            title = `${customTitle} |  ${project.value}`;
        }

        useSeoMeta({
            title,
        });
    };

    nuxtApp.hook('app:rendered', () => {
        updateMeta();
    });

    nuxtApp.hook('page:finish', () => {
        updateMeta();
    });
});
