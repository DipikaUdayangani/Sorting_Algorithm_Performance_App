package algorithms;

import util.DSutil;

/**
 * Implementation of the Quick Sort algorithm.
 */
public class QuickSort {

    public static <E extends Comparable<E>> void sort(E[] array) {
        if (array == null || array.length < 2) return;
        quickSort(array, 0, array.length - 1);
    }

    private static <E extends Comparable<E>> void quickSort(E[] array, int low, int high) {
        if (low < high) {
            int pivotIndex = partition(array, low, high);
            quickSort(array, low, pivotIndex - 1);
            quickSort(array, pivotIndex + 1, high);
        }
    }

    private static <E extends Comparable<E>> int partition(E[] array, int low, int high) {
        // Choose the rightmost element as the pivot
        E pivot = array[high];
        int i = (low - 1); // Index of smaller element

        for (int j = low; j < high; j++) {

            if (array[j].compareTo(pivot) <= 0) {
                i++;

                DSutil.swap(array, i, j);
            }
        }


        DSutil.swap(array, i + 1, high);

        return i + 1;
    }
}
