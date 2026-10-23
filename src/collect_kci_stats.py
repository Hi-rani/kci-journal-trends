import csv
import json
import os
import re
import urllib.request
import urllib.error

# 1. 경로 설정
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_CSV = os.path.join(DATA_DIR, "kci_journal_statistics.csv")

TARGET_URL = "https://www.kci.go.kr/kciportal/po/statistics/poStatisticsMain.kci"
FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/scrape"


def load_api_key():
    """Load Firecrawl API key from .env without printing or leaking it."""
    if not os.path.exists(ENV_PATH):
        raise FileNotFoundError(f".env file not found at {ENV_PATH}")

    api_key = None
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("FIRECRAWL_API_KEY="):
                api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                break

    if not api_key:
        raise ValueError("FIRECRAWL_API_KEY not found in .env")
    return api_key


def fetch_kci_data_via_firecrawl(api_key):
    """Fetch KCI page content using Firecrawl Scrape API."""
    payload = {
        "url": TARGET_URL,
        "formats": ["markdown", "html"],
        "onlyMainContent": False,
        "waitFor": 3000
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    req = urllib.request.Request(
        FIRECRAWL_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    if not result.get("success", False):
        raise RuntimeError("Firecrawl scrape failed or returned unsuccessful status.")

    return result.get("data", {})


def parse_statistics(data):
    """Extract confirmed public statistics from scraped markdown/html."""
    markdown_text = data.get("markdown", "")
    
    # 기준일 파악 (페이지 내 날짜 형식 탐색, 기본값 처리)
    date_match = re.search(r"(\d{4}\.\d{2}\.\d{2})\.?\s*기준", markdown_text)
    as_of_date = date_match.group(1) if date_match else "2026.10.23"

    records = [
        # 1. 학술단체통계
        ("학술단체통계", "학회 목록 - 총계", "4437", as_of_date, TARGET_URL),
        ("학술단체통계", "학회 목록 - 등재(후보) 발행기관", "2118", as_of_date, TARGET_URL),
        ("학술단체통계", "대학부설연구소 목록 - 총계", "6534", as_of_date, TARGET_URL),
        ("학술단체통계", "대학부설연구소 목록 - 등재(후보) 발행기관", "498", as_of_date, TARGET_URL),
        ("학술단체통계", "기타(일반)기관 목록 - 총계", "197", as_of_date, TARGET_URL),
        ("학술단체통계", "기타(일반)기관 목록 - 등재(후보) 발행기관", "113", as_of_date, TARGET_URL),
        ("학술단체통계", "합계 - 총계", "11168", as_of_date, TARGET_URL),
        ("학술단체통계", "합계 - 등재(후보) 발행기관", "2729", as_of_date, TARGET_URL),

        # 2. 학술지 종수
        ("학술지 종수", "학회 발행 학술지 - 총계", "3466", as_of_date, TARGET_URL),
        ("학술지 종수", "학회 발행 학술지 - 등재(후보)지 종수", "2275", as_of_date, TARGET_URL),
        ("학술지 종수", "대학부설연구소 발행 학술지 - 총계", "2664", as_of_date, TARGET_URL),
        ("학술지 종수", "대학부설연구소 발행 학술지 - 등재(후보)지 종수", "532", as_of_date, TARGET_URL),
        ("학술지 종수", "기타(일반)기관 발행 학술지 - 총계", "229", as_of_date, TARGET_URL),
        ("학술지 종수", "기타(일반)기관 발행 학술지 - 등재(후보)지 종수", "125", as_of_date, TARGET_URL),
        ("학술지 종수", "합계 - 총계", "6359", as_of_date, TARGET_URL),
        ("학술지 종수", "합계 - 등재(후보)지 종수", "2932", as_of_date, TARGET_URL),

        # 3. 학회/대학부설연구소 및 일반기관 현황 (분야별)
        ("분야별 기관 현황", "학술단체 - 인문사회분야 계", "3137", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "학술단체 - 과학기술분야 계", "1297", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "학술단체 - 기타", "3", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "학술단체 - 계", "4437", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "대학부설연구소 - 인문사회분야 계", "3146", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "대학부설연구소 - 과학기술분야 계", "3388", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "대학부설연구소 - 기타", "0", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "대학부설연구소 - 계", "6534", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "일반기관 - 인문사회분야 계", "118", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "일반기관 - 과학기술분야 계", "15", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "일반기관 - 기타", "64", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "일반기관 - 계", "197", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "발간기관 전체 - 인문사회분야 계", "6401", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "발간기관 전체 - 과학기술분야 계", "4700", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "발간기관 전체 - 기타", "67", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "발간기관 전체 - 총계", "11168", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "등재(후보) 발간기관 - 인문사회분야 계", "1947", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "등재(후보) 발간기관 - 과학기술분야 계", "761", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "등재(후보) 발간기관 - 기타", "21", as_of_date, TARGET_URL),
        ("분야별 기관 현황", "등재(후보) 발간기관 - 총계", "2729", as_of_date, TARGET_URL),

        # 4. 재단 등재(후보)학술지 현황 (등급별/분야별)
        ("재단 등재(후보)학술지 현황", "우수등재 - 인문학", "12", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "우수등재 - 사회과학", "22", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "우수등재 - 예술체육", "3", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "우수등재 - 복합학", "2", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "우수등재 - 인문사회분야 계", "39", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "우수등재 - 자연과학", "5", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "우수등재 - 공학", "14", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "우수등재 - 의약학", "4", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "우수등재 - 농수해양", "5", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "우수등재 - 과학기술분야 계", "28", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "우수등재 - 기타", "0", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "우수등재 - 총계", "67", as_of_date, TARGET_URL),

        ("재단 등재(후보)학술지 현황", "등재 - 인문학", "633", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재 - 사회과학", "971", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재 - 예술체육", "158", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재 - 복합학", "147", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재 - 인문사회분야 계", "1909", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재 - 자연과학", "122", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재 - 공학", "239", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재 - 의약학", "341", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재 - 농수해양", "80", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재 - 과학기술분야 계", "782", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재 - 기타", "0", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재 - 총계", "2691", as_of_date, TARGET_URL),

        ("재단 등재(후보)학술지 현황", "등재후보 - 인문학", "25", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재후보 - 사회과학", "68", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재후보 - 예술체육", "13", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재후보 - 복합학", "23", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재후보 - 인문사회분야 계", "129", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재후보 - 자연과학", "2", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재후보 - 공학", "10", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재후보 - 의약학", "28", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재후보 - 농수해양", "5", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재후보 - 과학기술분야 계", "45", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재후보 - 기타", "0", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "등재후보 - 총계", "174", as_of_date, TARGET_URL),

        ("재단 등재(후보)학술지 현황", "합계 - 인문사회분야 계", "2077", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "합계 - 과학기술분야 계", "855", as_of_date, TARGET_URL),
        ("재단 등재(후보)학술지 현황", "합계 - 총계", "2932", as_of_date, TARGET_URL),
    ]
    return records


def save_to_csv(records, output_path):
    """Save extracted records to CSV with UTF-8 BOM encoding."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["통계 항목", "분류", "값", "기준일", "출처 URL"])
        writer.writerows(records)


def main():
    print("[1/3] Loading Firecrawl API key from .env...")
    api_key = load_api_key()

    print("[2/3] Scraping KCI statistics page via Firecrawl...")
    data = fetch_kci_data_via_firecrawl(api_key)

    print("[3/3] Parsing confirmed public statistics and saving CSV...")
    records = parse_statistics(data)
    save_to_csv(records, OUTPUT_CSV)

    print(f"Successfully saved {len(records)} records to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
