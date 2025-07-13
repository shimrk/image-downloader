/// <reference types="chrome"/>

// Chrome拡張機能の型定義を拡張
declare namespace chrome {
    namespace runtime {
        interface InstalledDetails {
            reason: string;
            previousVersion?: string;
            id?: string;
        }
    }
} 