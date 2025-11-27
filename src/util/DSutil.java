package util;


public class DSutil {

    /**
     * Swaps two elements in an array.
     */
    public static <E> void swap(E[] array, int i, int j) {
        E temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}