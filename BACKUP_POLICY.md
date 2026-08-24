# Alumas Backup Policy — başlangıç şablonu

Production'a geçmeden saklama süreleri ve RPO/RTO iş/hukuk gereksinimleriyle kesinleştirilmelidir. Önerilen başlangıç: günlük tam DB backup, en az haftalık restore testi, backup'ların uygulama sunucusundan ayrı şifreli storage'da saklanması. Backup erişimi production DB erişiminden ayrı tutulmalıdır. Sağlık verisi içeren backup'lar da hassas veri kabul edilir.
